import { useState } from 'react';
import { explain } from '../services/api';

export default function ChatWithAI() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);

  const handleSend = async () => {
    if (!input) return;
    setChat([...chat, { role: 'user', text: input }]);
    const res = await explain(input);
    setChat(prev => [...prev, { role: 'ai', text: res.result }]);
    setInput('');
  };

  return (
    <div>
      <h2>Chat with AI</h2>
      <div style={{ border: '1px solid #ccc', padding: '10px', maxHeight: '300px', overflowY: 'auto' }}>
        {chat.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
