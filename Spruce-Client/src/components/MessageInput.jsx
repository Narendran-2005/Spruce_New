import { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend?.(text);
        setText('');
      }}
      className="flex gap-2 mt-3"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded px-3 py-2"
      />
      <button className="px-4 py-2 rounded bg-blue-600 text-white">Send</button>
    </form>
  );
}

