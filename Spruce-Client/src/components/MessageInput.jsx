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
      className="flex gap-2 p-4 bg-[#2f3136] border-t border-gray-700"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-[#40444b] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
      />
      <button className="px-6 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors font-medium">
        Send
      </button>
    </form>
  );
}

