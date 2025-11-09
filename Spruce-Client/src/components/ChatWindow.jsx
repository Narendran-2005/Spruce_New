import { useMemo, useRef, useEffect } from 'react';
import { formatTime } from '../utils/formatUtils.js';

export default function ChatWindow({ messages = [], selfId }) {
  const endRef = useRef(null);
  const sorted = useMemo(() => messages.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)), [messages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sorted.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[#36393f]">
      {sorted.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</div>
      ) : (
        sorted.map((m) => (
          <div key={m.id} className={`mb-4 flex ${m.senderId === selfId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
              m.senderId === selfId 
                ? 'bg-[#5865f2] text-white' 
                : 'bg-[#2f3136] text-gray-100 border border-gray-700'
            }`}>
              <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
              <div className={`text-[10px] mt-1 text-right ${
                m.senderId === selfId ? 'text-blue-200' : 'text-gray-400'
              }`}>
                {formatTime(m.ts)}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

