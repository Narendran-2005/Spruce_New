import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import MessageInput from '../components/MessageInput.jsx';
import useSessionStore from '../store/sessionStore.js';
import useWebSocket from '../hooks/useWebSocket.js';
import { listContacts } from '../api/contacts.js';

export default function ChatPage() {
  const user = useSessionStore((s) => s.user);
  const contacts = useSessionStore((s) => s.contacts);
  const chats = useSessionStore((s) => s.chats);
  const setContacts = useSessionStore((s) => s.setContacts);
  const [active, setActive] = useState(null);
  const { sendSecureMessage } = useWebSocket();

  useEffect(() => {
    (async () => {
      try {
        const data = await listContacts();
        setContacts(data);
        if (!active && data?.length) setActive(data[0]);
      } catch {
        // mock fallback
        const mock = [
          { id: 'u2', username: 'Yokesh' },
          { id: 'u3', username: 'Vasanth' }
        ];
        setContacts(mock);
        if (!active) setActive(mock[0]);
      }
    })();
  }, []);

  const messages = useMemo(() => (active ? (chats[active.id] || []) : []), [chats, active]);

  return (
    <div className="flex gap-4">
      <Sidebar contacts={contacts} activeId={active?.id} onSelect={setActive} />
      <div className="flex-1 flex flex-col">
        <div className="mb-2 font-semibold">{active ? `Chat with ${active.username}` : 'Select a contact'}</div>
        <ChatWindow messages={messages} selfId={user?.id} />
        {active && (
          <MessageInput onSend={(t) => sendSecureMessage(active, t)} />
        )}
      </div>
    </div>
  );
}

