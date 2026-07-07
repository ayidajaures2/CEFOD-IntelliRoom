// src/components/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FiHome, FiCalendar, FiList, FiUser, FiSettings, 
  FiUsers, FiSun, FiMoon, FiUserPlus, FiBookOpen
} from 'react-icons/fi';

function DashboardLayout() {
  const { user } = useAuth();
  const role = user?.role || 'client';

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getIcon = (to) => {
    const icons = {
      '/dashboard': <FiHome className="w-5 h-5" />,
      '/bookings/new': <FiCalendar className="w-5 h-5" />,
      '/my-bookings': <FiList className="w-5 h-5" />,
      '/profile': <FiUser className="w-5 h-5" />,
      '/receptionist': <FiHome className="w-5 h-5" />,
      '/receptionist/bookings': <FiCalendar className="w-5 h-5" />,
      '/cashier': <FiHome className="w-5 h-5" />,
      '/admin': <FiHome className="w-5 h-5" />,
      '/admin/rooms': <FiBookOpen className="w-5 h-5" />,
      '/admin/users': <FiUsers className="w-5 h-5" />,
      '/admin/settings': <FiSettings className="w-5 h-5" />,
    };
    return icons[to] || <FiHome className="w-5 h-5" />;
  };

  const links = {
    client: [
      { to: '/dashboard', label: 'Tableau de bord' },
      { to: '/bookings/new', label: 'Nouvelle réservation' },
      { to: '/my-bookings', label: 'Mes réservations' },
      { to: '/profile', label: 'Mon profil' },
    ],
    receptionist: [
      { to: '/receptionist', label: 'Tableau de bord' },
      { to: '/receptionist/bookings', label: 'Gérer les réservations' },
      { to: '/profile', label: 'Mon profil' },
    ],
    cashier: [
      { to: '/cashier', label: 'Tableau de bord' },
      { to: '/profile', label: 'Mon profil' },
    ],
    admin: [
      { to: '/admin', label: 'Tableau de bord' },
      { to: '/admin/rooms', label: 'Gérer les salles' },
      { to: '/admin/users', label: 'Gérer les utilisateurs' },
      { to: '/admin/settings', label: 'Configuration' },
      { to: '/profile', label: 'Mon profil' },
    ],
  };

  const currentLinks = links[role] || links.client;
  const isDark = theme === 'dark';

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      <aside className={`
        w-64 p-4 flex flex-col fixed h-full border-r
        ${isDark ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'}
      `}>
        <div className="mb-8 mt-2 px-3">
          <h1 className="text-2xl font-bold">
            <span className={isDark ? 'text-white' : 'text-gray-900'}>CEFOD Intell</span>
            <span className="text-orange-500">i</span>
            <span className={isDark ? 'text-white' : 'text-gray-900'}>Room</span>
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-white' : 'text-gray-500'}`}>
            Espace {role}
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {currentLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                ${isDark 
                  ? 'text-white hover:text-white hover:bg-orange-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-100'
                }
              `}
            >
              <span className={`transition-colors ${isDark ? 'text-white group-hover:text-white' : 'text-gray-500 group-hover:text-orange-600'}`}>
                {getIcon(link.to)}
              </span>
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className={`border-t pt-4 mt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm ${isDark ? 'text-black' : 'text-white'}`}>
              {user?.prenom?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {user?.prenom} {user?.nom}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-white' : 'text-gray-500'}`}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className={`flex-1 ml-64 p-8 min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition ${
              isDark 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
        </div>

        <div className={isDark ? 'text-white' : 'text-gray-900'}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;