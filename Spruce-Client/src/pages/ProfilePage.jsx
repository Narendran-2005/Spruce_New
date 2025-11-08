import { useEffect, useState } from 'react';
import { loadKeys, generatePermanentKeypairs } from '../crypto/hybridKeyManager.js';

export default function ProfilePage() {
  const [keys, setKeys] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setKeys(await loadKeys());
    })();
  }, []);

  async function regenerate() {
    setRegenLoading(true);
    try {
      const k = await generatePermanentKeypairs();
      setKeys(k);
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Profile & Keys</h1>
      {!keys ? (
        <div className="text-sm text-gray-600">No keys found. Register to generate.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded bg-white">
            <div className="font-semibold mb-2">X25519</div>
            <div className="text-xs break-all"><strong>Public:</strong> {keys.perm_pub_x25519}</div>
          </div>
          <div className="p-3 border rounded bg-white">
            <div className="font-semibold mb-2">Kyber768</div>
            <div className="text-xs break-all"><strong>Public:</strong> {keys.kyber_pub}</div>
          </div>
          <div className="p-3 border rounded bg-white md:col-span-2">
            <div className="font-semibold mb-2">Dilithium3</div>
            <div className="text-xs break-all"><strong>Public:</strong> {keys.dilithium_pub}</div>
          </div>
        </div>
      )}
      <button onClick={regenerate} disabled={regenLoading} className="mt-4 px-4 py-2 rounded bg-orange-600 text-white">
        {regenLoading ? 'Regenerating...' : 'Regenerate Keys (local)'}
      </button>
    </div>
  );
}

