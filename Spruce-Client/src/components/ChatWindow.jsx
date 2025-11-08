import { useMemo, useRef, useEffect } from 'react';
import { formatTime } from '../utils/formatUtils.js';

export default function ChatWindow({ messages = [], selfId }) {
  const endRef = useRef(null);
  const sorted = useMemo(() => messages.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)), [messages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sorted.length]);

  return (
    <div className="flex-1 h-[calc(100vh-10rem)] overflow-y-auto p-4 bg-gray-50 border rounded">
      {sorted.map((m) => (
        <div key={m.id} className={`mb-2 flex ${m.senderId === selfId ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[70%] px-3 py-2 rounded ${m.senderId === selfId ? 'bg-green-100' : 'bg-white border'}`}>
            <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
            <div className="text-[10px] text-gray-500 mt-1 text-right">{formatTime(m.ts)}</div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

