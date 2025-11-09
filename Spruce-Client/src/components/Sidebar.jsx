export default function Sidebar({ contacts, activeId, onSelect }) {
  return (
    <aside className="w-64 bg-[#2f3136] rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 font-semibold text-white border-b border-gray-700">Contacts</div>
      <ul className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <li className="px-4 py-3 text-gray-400 text-sm">No contacts</li>
        ) : (
          contacts.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c)}
                className={`w-full text-left px-4 py-2 hover:bg-[#36393f] transition-colors ${
                  activeId === c.id ? 'bg-[#36393f] border-l-2 border-[#5865f2]' : ''
                } text-gray-300 hover:text-white`}
              >
                {c.username}
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

