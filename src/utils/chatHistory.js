// chatHistory.js - Client-side chat history management
class ChatHistoryManager {
  constructor() {
    this.storageKey = 'ai_chat_history';
    this.maxConversations = 50; // Maximum conversations to store
    this.maxMessagesPerConversation = 100; // Maximum messages per conversation
    this.currentConversationId = null;
    this.initialize();
  }

  initialize() {
    // Load or initialize chat history
    if (!this.getStorage()) {
      this.setStorage({
        conversations: [],
        settings: {
          maxConversations: this.maxConversations,
          maxMessages: this.maxMessagesPerConversation,
          autoSave: true
        },
        version: '1.0'
      });
    }
    
    // Create new conversation if none exists
    if (this.getConversations().length === 0) {
      this.createNewConversation();
    } else {
      // Load the last active conversation
      this.currentConversationId = this.getLastActiveConversationId();
    }
  }

  // Storage methods
  getStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading chat history:', error);
      return null;
    }
  }

  setStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving chat history:', error);
      return false;
    }
  }

  // Conversation management
  createNewConversation(title = 'New Chat') {
    const conversation = {
      id: this.generateId(),
      title: title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: 'tinyllama',
      messageCount: 0,
      isActive: true
    };

    const storage = this.getStorage();
    storage.conversations.unshift(conversation); // Add to beginning
    
    // Remove oldest conversation if exceeding limit
    if (storage.conversations.length > this.maxConversations) {
      storage.conversations.pop();
    }

    this.setStorage(storage);
    this.currentConversationId = conversation.id;
    
    // Dispatch event for UI updates
    this.dispatchEvent('conversationCreated', conversation);
    
    return conversation;
  }

  getConversations() {
    const storage = this.getStorage();
    return storage?.conversations || [];
  }

  getCurrentConversation() {
    if (!this.currentConversationId) return null;
    return this.getConversation(this.currentConversationId);
  }

  getConversation(conversationId) {
    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === conversationId);
  }

  switchConversation(conversationId) {
    const conversation = this.getConversation(conversationId);
    if (conversation) {
      // Deactivate all conversations
      this.deactivateAllConversations();
      
      // Activate selected conversation
      conversation.isActive = true;
      conversation.updatedAt = new Date().toISOString();
      
      this.currentConversationId = conversationId;
      this.updateConversation(conversation);
      
      this.dispatchEvent('conversationSwitched', conversation);
      return true;
    }
    return false;
  }

  deleteConversation(conversationId) {
    const storage = this.getStorage();
    const index = storage.conversations.findIndex(conv => conv.id === conversationId);
    
    if (index !== -1) {
      const deleted = storage.conversations.splice(index, 1)[0];
      
      // If we deleted the current conversation, switch to another
      if (this.currentConversationId === conversationId) {
        if (storage.conversations.length > 0) {
          this.currentConversationId = storage.conversations[0].id;
          storage.conversations[0].isActive = true;
        } else {
          this.currentConversationId = null;
          this.createNewConversation();
        }
      }
      
      this.setStorage(storage);
      this.dispatchEvent('conversationDeleted', deleted);
      return true;
    }
    return false;
  }

  // Message management
  addMessage(message, role = 'user') {
    if (!this.currentConversationId) {
      this.createNewConversation();
    }

    const conversation = this.getCurrentConversation();
    if (!conversation) return null;

    const messageObj = {
      id: this.generateId(),
      role: role,
      content: message,
      timestamp: new Date().toISOString(),
      model: conversation.model
    };

    conversation.messages.unshift(messageObj); // Add to beginning
    conversation.messageCount++;
    conversation.updatedAt = new Date().toISOString();

    // Remove oldest messages if exceeding limit
    if (conversation.messages.length > this.maxMessagesPerConversation) {
      conversation.messages.pop();
    }

    // Auto-generate title from first user message
    if (conversation.messageCount === 1 && role === 'user') {
      conversation.title = this.generateTitle(message);
    }

    this.updateConversation(conversation);
    this.dispatchEvent('messageAdded', { conversation, message: messageObj });

    return messageObj;
  }

  addAIResponse(message, model = null) {
    return this.addMessage(message, 'assistant');
  }

  getMessages(conversationId = null) {
    const conversation = conversationId ? 
      this.getConversation(conversationId) : 
      this.getCurrentConversation();
    
    return conversation?.messages || [];
  }

  // Search and filtering
  searchMessages(query) {
    const results = [];
    const conversations = this.getConversations();
    
    conversations.forEach(conversation => {
      conversation.messages.forEach(message => {
        if (message.content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            conversation: conversation,
            message: message,
            match: message.content
          });
        }
      });
    });
    
    return results;
  }

  filterByModel(model) {
    return this.getConversations().filter(conv => conv.model === model);
  }

  // Export/Import
  exportConversation(conversationId = null) {
    const conversation = conversationId ? 
      this.getConversation(conversationId) : 
      this.getCurrentConversation();
    
    if (!conversation) return null;

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      conversation: conversation
    };

    return JSON.stringify(exportData, null, 2);
  }

  exportAll() {
    const storage = this.getStorage();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ...storage
    };

    return JSON.stringify(exportData, null, 2);
  }

  importData(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.conversation) {
        // Single conversation import
        this.importConversation(importData.conversation);
      } else if (importData.conversations) {
        // Full backup import
        this.importBackup(importData);
      }
      
      this.dispatchEvent('dataImported', importData);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  importConversation(conversationData) {
    const storage = this.getStorage();
    
    // Generate new ID to avoid conflicts
    conversationData.id = this.generateId();
    conversationData.importedAt = new Date().toISOString();
    
    storage.conversations.unshift(conversationData);
    
    // Remove oldest if exceeding limit
    if (storage.conversations.length > this.maxConversations) {
      storage.conversations.pop();
    }
    
    this.setStorage(storage);
    this.switchConversation(conversationData.id);
  }

  // Utility methods
  generateId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateTitle(message) {
    // Simple title generation from first few words
    const words = message.trim().split(/\s+/);
    const firstFewWords = words.slice(0, 5).join(' ');
    return firstFewWords.length > 30 ? 
      firstFewWords.substring(0, 30) + '...' : 
      firstFewWords;
  }

  getLastActiveConversationId() {
    const conversations = this.getConversations();
    const active = conversations.find(conv => conv.isActive);
    return active ? active.id : (conversations[0]?.id || null);
  }

  deactivateAllConversations() {
    const storage = this.getStorage();
    storage.conversations.forEach(conv => {
      conv.isActive = false;
    });
    this.setStorage(storage);
  }

  updateConversation(conversation) {
    const storage = this.getStorage();
    const index = storage.conversations.findIndex(conv => conv.id === conversation.id);
    
    if (index !== -1) {
      storage.conversations[index] = conversation;
      this.setStorage(storage);
      return true;
    }
    return false;
  }

  // Statistics
  getStatistics() {
    const conversations = this.getConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
    const totalWords = conversations.reduce((sum, conv) => {
      return sum + conv.messages.reduce((msgSum, msg) => {
        return msgSum + (msg.content.split(/\s+/).length || 0);
      }, 0);
    }, 0);

    return {
      totalConversations: conversations.length,
      totalMessages: totalMessages,
      totalWords: totalWords,
      oldestConversation: conversations.length > 0 ? 
        new Date(conversations[conversations.length - 1].createdAt) : null,
      storageUsage: this.getStorageUsage()
    };
  }

  getStorageUsage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? new Blob([data]).size : 0;
  }

  // Event system for UI updates
  dispatchEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
  }

  on(eventName, callback) {
    window.addEventListener(eventName, callback);
  }

  off(eventName, callback) {
    window.removeEventListener(eventName, callback);
  }

  // Cleanup methods
  clearAll() {
    localStorage.removeItem(this.storageKey);
    this.currentConversationId = null;
    this.initialize();
    this.dispatchEvent('allDataCleared', null);
  }

  clearConversation(conversationId) {
    const conversation = this.getConversation(conversationId);
    if (conversation) {
      conversation.messages = [];
      conversation.messageCount = 0;
      conversation.updatedAt = new Date().toISOString();
      this.updateConversation(conversation);
      this.dispatchEvent('conversationCleared', conversation);
      return true;
    }
    return false;
  }
}

// Initialize global instance
window.chatHistory = new ChatHistoryManager();

export default ChatHistoryManager;
