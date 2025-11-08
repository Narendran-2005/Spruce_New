export default function Sidebar({ contacts, activeId, onSelect }) {
  return (
    <aside className="w-64 border-r bg-white h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-3 font-semibold">Contacts</div>
      <ul>
        {contacts.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${activeId === c.id ? 'bg-gray-100' : ''}`}
            >
              {c.username}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

