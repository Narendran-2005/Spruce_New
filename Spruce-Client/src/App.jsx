import { Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import useSessionStore from './store/sessionStore.js';

export default function App() {
  const token = useSessionStore((s) => s.token);
  const logout = useSessionStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to={token ? '/chat' : '/login'} className="font-semibold text-lg">Spruce Client</Link>
          <nav className="flex items-center gap-4 text-sm">
            {token ? (
              <>
                <Link to="/chat" className="hover:underline">Chat</Link>
                <Link to="/groups" className="hover:underline">Groups</Link>
                <Link to="/profile" className="hover:underline">Profile</Link>
                <button onClick={logout} className="text-red-600 hover:underline">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chat" element={token ? <ChatPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/groups" element={token ? <GroupsPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={token ? '/chat' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

