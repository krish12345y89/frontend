import { useEffect, useState, useCallback } from 'react';

// Lightweight React hook that wraps the global window.chatHistory manager
export default function useChatHistory() {
  const [conversations, setConversations] = useState(() => {
    try {
      return window.chatHistory.getConversations();
    } catch (err) {
      return [];
    }
  });

  const [currentConversation, setCurrentConversation] = useState(() => {
    try {
      return window.chatHistory.getCurrentConversation();
    } catch (err) {
      return null;
    }
  });

  const refresh = useCallback(() => {
    setConversations(window.chatHistory.getConversations());
    setCurrentConversation(window.chatHistory.getCurrentConversation());
  }, []);

  useEffect(() => {
    // Event listeners
    const onCreated = () => refresh();
    const onSwitched = () => refresh();
    const onDeleted = () => refresh();
    const onMessage = () => refresh();
    const onImported = () => refresh();

    window.addEventListener('conversationCreated', onCreated);
    window.addEventListener('conversationSwitched', onSwitched);
    window.addEventListener('conversationDeleted', onDeleted);
    window.addEventListener('messageAdded', onMessage);
    window.addEventListener('dataImported', onImported);

    // Keep local state in sync
    const interval = setInterval(refresh, 1000 * 5); // every 5s as fallback

    return () => {
      window.removeEventListener('conversationCreated', onCreated);
      window.removeEventListener('conversationSwitched', onSwitched);
      window.removeEventListener('conversationDeleted', onDeleted);
      window.removeEventListener('messageAdded', onMessage);
      window.removeEventListener('dataImported', onImported);
      clearInterval(interval);
    };
  }, [refresh]);

  const createConversation = useCallback((title) => {
    return window.chatHistory.createNewConversation(title);
  }, []);

  const switchConversation = useCallback((id) => {
    return window.chatHistory.switchConversation(id);
  }, []);

  const deleteConversation = useCallback((id) => {
    return window.chatHistory.deleteConversation(id);
  }, []);

  const addMessage = useCallback((message) => {
    return window.chatHistory.addMessage(message, 'user');
  }, []);

  const addAIResponse = useCallback((message) => {
    return window.chatHistory.addAIResponse(message, 'assistant');
  }, []);

  const exportConversation = useCallback((id) => {
    return window.chatHistory.exportConversation(id);
  }, []);

  const exportAll = useCallback(() => {
    return window.chatHistory.exportAll();
  }, []);

  return {
    conversations,
    currentConversation,
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    addAIResponse,
    exportConversation,
    exportAll,
    refresh
  };
}
