export default function ContactList({ contacts = [], onSelect }) {
  return (
    <div className="space-y-2">
      {contacts.map((c) => (
        <button key={c.id} onClick={() => onSelect?.(c)} className="block w-full text-left px-3 py-2 border rounded hover:bg-gray-50">
          {c.username}
        </button>
      ))}
    </div>
  );
}

