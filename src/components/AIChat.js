import React, { useState } from 'react';
import './AIChat.css';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const processCommand = async (text) => {
    const lower = text.toLowerCase();
    
    // Parse natural language commands
    if (lower.includes('create folder')) {
      const match = text.match(/create\s+folder\s+(?:called\s+)?["']?([^"']+)["']?/i);
      const name = match ? match[1].trim() : 'New Folder';
      return { action: 'create_folder', data: { name } };
    }
    
    if (lower.includes('list') && lower.includes('folder')) {
      return { action: 'list_folders', data: {} };
    }
    
    if (lower.includes('show') && lower.includes('image')) {
      return { action: 'list_images', data: {} };
    }
    
    if (lower.includes('size') || lower.includes('how big')) {
      return { action: 'get_folder_size', data: {} };
    }
    
    if (lower.includes('delete folder')) {
      const match = text.match(/delete\s+folder\s+["']?([^"']+)["']?/i);
      const name = match ? match[1].trim() : null;
      return { action: 'delete_folder', data: { name } };
    }
    
    return { action: 'help', data: {} };
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    
    try {
      const { action, data } = await processCommand(userMsg);
      
      let response = '';
      
      switch (action) {
        case 'list_folders': {
          const res = await fetch('https://dobby-ads-backend-fu75.onrender.com/api/folders', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          });
          const data = await res.json();
          const folders = data.folders || [];
          response = folders.length ? folders.map(f => `📁 ${f.name}`).join('\n') : 'No folders found';
          break;
        }
        
        case 'create_folder': {
          const res = await fetch('https://dobby-ads-backend-fu75.onrender.com/api/folders', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('token') 
            },
            body: JSON.stringify({ name: data.name })
          });
          const result = await res.json();
          response = result.success ? `✅ Created folder "${data.name}"` : `❌ ${result.message}`;
          break;
        }
        
        case 'help': {
          response = `🤖 AI Commands:\n• "Create folder [name]"\n• "List folders"\n• "Show images in [folder]"\n• "Delete folder [name]"\n• "How big is [folder]?"`;
          break;
        }
        
        default:
          response = 'I understand these commands:\n• "Create folder [name]"\n• "List folders"\n• "Delete folder [name]"\n\nJust type naturally!';
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <span>🤖 AI Assistant</span>
      </div>
      
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-welcome">
            👋 AI is ready!<br/>
            <br/>
            Try:<br/>
            • "Create folder Marketing"<br/>
            • "List folders"<br/>
            • "Delete folder Test"
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="ai-message assistant">Thinking...</div>}
      </div>
      
      <div className="ai-chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type command..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
    </div>
  );
}