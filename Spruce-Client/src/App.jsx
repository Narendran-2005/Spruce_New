import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import AdminConsole from './pages/AdminConsole.jsx';
import useSessionStore from './store/sessionStore.js';

export default function App() {
  const token = useSessionStore((s) => s.token);
  const logout = useSessionStore((s) => s.logout);
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-[#36393f] text-gray-100">
      {!isAdminPage && (
        <header className="bg-[#2f3136] border-b border-gray-700">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link to={token ? '/chat' : '/login'} className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              🌲 Spruce
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {token ? (
                <>
                  <Link to="/chat" className="text-gray-300 hover:text-white transition-colors">Chat</Link>
                  <Link to="/groups" className="text-gray-300 hover:text-white transition-colors">Groups</Link>
                  <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">Profile</Link>
                  <Link to="/admin" className="text-gray-300 hover:text-white transition-colors">Admin</Link>
                  <button onClick={logout} className="text-red-400 hover:text-red-300 transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white transition-colors">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>
      )}
      <main className={isAdminPage ? '' : 'mx-auto max-w-6xl p-4'}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/chat" element={token ? <ChatPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/groups" element={token ? <GroupsPage /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={token ? <AdminConsole /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={token ? '/chat' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}




