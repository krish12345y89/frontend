import React, { useState, useEffect, useRef } from 'react';
import useChatHistory from '../hooks/useChatHistory';
import './ChatInterface.css';

export default function ChatInterface() {
  const { conversations, currentConversation, createConversation, switchConversation, addMessage, addAIResponse, exportConversation, exportAll, refresh } = useChatHistory();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('tinyllama');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesRef = useRef(null);
  const controllerRef = useRef(null);
  const [exportStatus, setExportStatus] = useState(null);

  useEffect(() => {
    // Keep UI updated
    const id = setInterval(() => refresh(), 2000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = 0; // keep to top because messages stored newest-first
    }
    // sync selected model with conversation
    if (currentConversation?.model) setSelectedModel(currentConversation.model);
  }, [currentConversation]);

  async function handleSend() {
    if (!input.trim()) return;
    // Prevent concurrent sends; user can cancel instead
    if (loading) return;

    setLoading(true);
    // Abort previous controller if any (cleanup)
    if (controllerRef.current) {
      try { controllerRef.current.abort(); } catch (_) {}
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    const userMessage = addMessage(input.trim());
    setInput('');
    try {
      const res = await fetch('https://llmapi.inferia.ai/api5000/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, model: selectedModel, stream: false }),
        signal: controller.signal
      });
      console.log("Response received:", res);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Server error: ${res.status} ${txt.slice(0,200)}`);
      }

      const data = await res.json();
      // Safely extract a displayable string from various response shapes
      function extractText(node) {
        if (node == null) return '';
        if (typeof node === 'string') return node;
        if (typeof node === 'number' || typeof node === 'boolean') return String(node);
        if (Array.isArray(node)) return node.map(extractText).filter(Boolean).join('\n');
        if (typeof node === 'object') {
          // common fields where the textual answer might live
          const candidates = ['response', 'final_response', 'output', 'text', 'message', 'content'];
          for (const k of candidates) {
            if (k in node && node[k] != null) {
              return extractText(node[k]);
            }
          }
          // Fallback: if object has a nested 'response' string
          for (const v of Object.values(node)) {
            const t = extractText(v);
            if (t) return t;
          }
          // As last resort, return a JSON string (shortened)
          try {
            return JSON.stringify(node);
          } catch (err) {
            return String(node);
          }
        }
        return String(node);
      }

      const finalText = extractText(data) || extractText(data?.response) || '';
      addAIResponse(finalText || '(no response)');
    } catch (err) {
      if (err.name === 'AbortError') {
        addAIResponse('[Cancelled]');
      } else {
        console.error(err);
        addAIResponse('Error: could not reach server');
      }
    } finally {
      setLoading(false);
      controllerRef.current = null;
      refresh();
    }
  }

  function handleCancel() {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setLoading(false);
    }
  }

  function handleModelChange(ev) {
    const m = ev.target.value;
    setSelectedModel(m);
    // persist model on conversation
    const conv = window.chatHistory.getCurrentConversation();
    if (conv) {
      conv.model = m;
      window.chatHistory.updateConversation(conv);
      refresh();
    }
  }

  async function handleExportConversation() {
    const data = exportConversation();
    if (!data) {
      setExportStatus('Nothing to export for this conversation');
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    const ok = await tryCopyOrDownload(data, `${currentConversation?.title ?? 'conversation'}.json`);
    setExportStatus(ok ? 'Conversation copied to clipboard / downloaded' : 'Export failed');
    setTimeout(() => setExportStatus(null), 3000);
  }

  async function handleExportAll() {
    const data = exportAll();
    if (!data) {
      setExportStatus('Nothing to export');
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }

    const ok = await tryCopyOrDownload(data, `chat-history-backup.json`);
    setExportStatus(ok ? 'Backup copied to clipboard / downloaded' : 'Export failed');
    setTimeout(() => setExportStatus(null), 3000);
  }

  return (
    <div className="chat-app-root">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Conversations</h3>
          <button onClick={() => createConversation('New Chat')}>New</button>
          <button onClick={() => handleExportAll()}>Export All</button>
        </div>

        <div className="conversations-list">
          {conversations.map(conv => (
            <div key={conv.id} className={`conv-item ${currentConversation?.id === conv.id ? 'active' : ''}`} onClick={() => switchConversation(conv.id)}>
              <div className="conv-title">{conv.title}</div>
              <div className="conv-meta">{new Date(conv.updatedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-main-header">
          <h2>{currentConversation?.title || 'Conversation'}</h2>
          <div className="header-actions">
            <select className="model-select" value={selectedModel} onChange={handleModelChange}>
              <option value="llama2">llama2</option>
              <option value="tinyllama">tinyllama</option>
            </select>
            <button onClick={() => handleExportConversation()}>Export</button>
            <button onClick={() => refresh()}>Refresh</button>
          </div>
        </header>

        <section className="messages" ref={messagesRef}>
          {currentConversation?.messages?.length === 0 ? (
            <div className="empty">No messages yet</div>
          ) : (
            currentConversation.messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-meta">{new Date(msg.timestamp).toLocaleString()}</div>
              </div>
            ))
          )}
        </section>

        <footer className="chat-input">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
          {loading ? (
            <>
              <div className="spinner" title="loading" />
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button onClick={handleSend}>Send</button>
          )}
        </footer>
        {exportStatus && <div className="export-status">{exportStatus}</div>}
      </main>
    </div>
  );
}

// Export helpers placed after component to keep top-level clean
async function tryCopyOrDownload(data, filename = 'export.json') {
  if (!data) return false;
  // Try clipboard first
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(data);
      return true;
    }
  } catch (err) {
    // ignore and fallback to download
  }

  try {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    return false;
  }
}

