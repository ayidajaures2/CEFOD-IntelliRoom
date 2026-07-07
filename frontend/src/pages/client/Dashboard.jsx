// src/pages/client/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { FiCalendar, FiList, FiUser, FiPlus, FiClock } from 'react-icons/fi';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Vous devez être connecté');
          setLoading(false);
          return;
        }

        // Récupérer les réservations du client
        const response = await axios.get('/api/client/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const bookings = response.data || [];
        
        // Calculer les statistiques
        const total = bookings.length;
        const upcoming = bookings.filter(b => 
          b.statut === 'en_attente' || b.statut === 'validee'
        ).length;
        const completed = bookings.filter(b => 
          b.statut === 'terminee'
        ).length;

        setStats({
          totalBookings: total,
          upcomingBookings: upcoming,
          completedBookings: completed
        });

        // Récupérer les 5 dernières réservations
        const recent = bookings.slice(0, 5).map(b => ({
          id: b.id_reservation,
          salle: b.salle?.libelle_salle || 'Salle inconnue',
          date: new Date(b.date_debut).toLocaleDateString('fr-FR'),
          statut: b.statut
        }));

        setRecentBookings(recent);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données client:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement de vos réservations');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ En attente' },
      validee: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Validée' },
      confirmee: { bg: 'bg-purple-100', text: 'text-purple-800', label: '🟣 Confirmée' },
      terminee: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Terminée' },
      annulee: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Annulée' }
    };
    return config[statut] || config.en_attente;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">❌ {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {user?.prenom} {user?.nom} 👋
          </h1>
          <p className="text-gray-600 mt-1">Bienvenue sur votre espace client</p>
        </div>
        <Link
          to="/bookings/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          <FiPlus className="w-5 h-5" />
          Nouvelle réservation
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total réservations</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiList className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Réservations à venir</p>
              <p className="text-3xl font-bold text-green-600">{stats.upcomingBookings}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCalendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Réservations terminées</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <FiClock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Réservations récentes</h2>
        </div>
        <div className="p-6">
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune réservation trouvée</p>
              <Link to="/bookings/new" className="text-orange-500 hover:text-orange-600 font-medium mt-2 inline-block">
                Faire une réservation →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => {
                const status = getStatusBadge(booking.statut);
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.salle}</p>
                      <p className="text-sm text-gray-500">{booking.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {recentBookings.length > 0 && (
            <div className="mt-4 text-center">
              <Link to="/my-bookings" className="text-orange-500 hover:text-orange-600 font-medium">
                Voir toutes mes réservations →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;