import React, { useState } from 'react';
import './AIChat.css';

export default function AIChat({ onAction, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const processCommand = async (text) => {
    const lower = text.toLowerCase();
    
    // Create folder
    if (lower.includes('create') && lower.includes('folder')) {
      const match = text.match(/create\s+(?:a\s+)?folder\s+(?:called\s+)?["']?([^"']+)["']?/i);
      const name = match ? match[1].trim() : 'New Folder';
      return { action: 'create_folder', data: { name } };
    }
    
    // List folders
    if ((lower.includes('list') || lower.includes('show') || lower.includes('all')) && lower.includes('folder')) {
      return { action: 'list_folders', data: {} };
    }
    
    // Show images
    if ((lower.includes('show') || lower.includes('list') || lower.includes('what')) && lower.includes('image')) {
      // Try to extract folder name from query
      const match = text.match(/(?:in|from|inside)\s+(?:folder\s+)?["']?([^"']+)["']?/i);
      const folderName = match ? match[1].trim() : null;
      return { action: 'show_images', data: { folderName } };
    }
    
    // Delete folder
    if (lower.includes('delete') && lower.includes('folder')) {
      const match = text.match(/delete\s+(?:the\s+)?folder\s+["']?([^"']+)["']?/i);
      const name = match ? match[1].trim() : null;
      return { action: 'delete_folder', data: { name: name || 'unknown' } };
    }
    
    // Folder size
    if (lower.includes('size') || lower.includes('how big')) {
      return { action: 'get_folder_size', data: {} };
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
          if (result.success && onAction) onAction();
          break;
        }
        
        case 'help': {
          response = `🤖 AI Commands:\n• "Create folder [name]"\n• "List folders"\n• "Show images in [folder]"\n• "Delete folder [name]"\n• "How big is [folder]?"`;
          break;
        }
        
        case 'delete_folder': {
          // First get all folders to find by name
          const listRes = await fetch('https://dobby-ads-backend-fu75.onrender.com/api/folders', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          });
          const listData = await listRes.json();
          const folders = listData.folders || [];
          const folder = folders.find(f => f.name.toLowerCase() === data.name.toLowerCase());
          
          if (!folder) {
            response = `❌ Folder "${data.name}" not found`;
          } else {
            const delRes = await fetch(`https://dobby-ads-backend-fu75.onrender.com/api/folders/${folder.id}`, {
              method: 'DELETE',
              headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const delData = await delRes.json();
            response = delData.success ? `✅ Deleted folder "${data.name}"` : `❌ ${delData.message}`;
            if (delData.success && onAction) onAction();
          }
          break;
        }
        
        case 'show_images': {
          // Need folder ID - get from folder name first
          const listRes = await fetch('https://dobby-ads-backend-fu75.onrender.com/api/folders', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          });
          const listData = await listRes.json();
          const folders = listData.folders || [];
          const folder = folders.find(f => f.name.toLowerCase().includes(data.folderName?.toLowerCase()));
          
          if (!folder) {
            response = `❌ Folder "${data.folderName}" not found`;
          } else {
            const imgRes = await fetch(`https://dobby-ads-backend-fu75.onrender.com/api/images/folder/${folder.id}`, {
              headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const imgData = await imgRes.json();
            const images = imgData.images || [];
            response = images.length ? images.map(img => `🖼️ ${img.name} (${img.sizeFormatted})`).join('\n') : 'No images in this folder';
          }
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
        <span>AI Assistant</span>
        <button className="close-btn" onClick={onClose}>x</button>
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