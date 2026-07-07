// frontend/src/pages/receptionist/ReceptionistDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiPlus,
  FiEye,
  FiMessageSquare,
  FiFileText,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function ReceptionistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRooms: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const [statsRes, bookingsRes, chartRes] = await Promise.all([
        axios.get('/api/receptionist/stats', { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get('/api/receptionist/bookings', { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get('/api/receptionist/chart-data', { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);

      setStats(statsRes.data || stats);
      setAllBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);

      setRecentMessages([
        { id: 1, client: 'Jean Dupont', message: 'Besoin d\'une salle pour un séminaire', date: 'Il y a 2 min', lu: false },
        { id: 2, client: 'Marie Kone', message: 'Peut-on ajouter un vidéoprojecteur ?', date: 'Il y a 15 min', lu: true },
      ]);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleValidate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/receptionist/bookings/${id}/validate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ Réservation #${id} validée avec succès !`);
      fetchDashboardData();
    } catch (err) {
      alert('❌ Erreur lors de la validation de la réservation');
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir annuler la réservation #${id} ?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/receptionist/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ Réservation #${id} annulée avec succès !`);
      fetchDashboardData();
    } catch (err) {
      alert('❌ Erreur lors de l\'annulation de la réservation');
      console.error(err);
    }
  };

  const getStatusBadge = (statut) => {
    const config = {
      effectuee: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Effectuée' },
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ En attente' },
      annulee: { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Annulée' },
      validee: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🔵 Validée' },
      terminee: { bg: 'bg-gray-100', text: 'text-gray-700', label: '⚪ Terminée' },
      confirmee: { bg: 'bg-purple-100', text: 'text-purple-700', label: '🟣 Confirmée' }
    };
    return config[statut] || config.en_attente;
  };

  const filteredBookings = Array.isArray(allBookings) ? allBookings.filter(booking => {
    const matchSearch = booking.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        booking.salle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || booking.statut === filterStatus;
    return matchSearch && matchStatus;
  }) : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">❌ {error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Réceptionniste</h1>
          <p className="text-gray-600 mt-1">
            Bienvenue, {user?.prenom} {user?.nom} 👋
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
          </button>
          <Link
            to="/receptionist/bookings/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition shadow-sm"
          >
            <FiPlus className="w-5 h-5" />
            Nouvelle réservation
          </Link>
          <Link
            to="/receptionist/conversations"
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            <FiMessageSquare className="w-5 h-5" />
            Messages
            {recentMessages.some(m => !m.lu) && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                {recentMessages.filter(m => !m.lu).length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Réservations du jour</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings || 0}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiCalendar className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings || 0}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Effectuées</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedBookings || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Annulées</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelledBookings || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FiXCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Taux d'occupation</p>
              <p className="text-2xl font-bold text-blue-600">{stats.occupancyRate || 0}%</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Évolution des réservations</h2>
            <p className="text-sm text-gray-500">7 derniers jours</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span> Effectuées
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span> En attente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Annulées
            </span>
          </div>
        </div>
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="jour" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="effectuees" stroke="#22c55e" strokeWidth={3} name="Effectuées" />
              <Line type="monotone" dataKey="en_attente" stroke="#eab308" strokeWidth={3} name="En attente" />
              <Line type="monotone" dataKey="annulees" stroke="#ef4444" strokeWidth={3} name="Annulées" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>
        )}
      </div>

      {/* LISTE DES RÉSERVATIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Toutes les réservations</h2>
            <p className="text-sm text-gray-500">{allBookings.length} réservations au total</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="effectuee">✅ Effectuées</option>
              <option value="en_attente">⏳ En attente</option>
              <option value="annulee">❌ Annulées</option>
              <option value="validee">🔵 Validées</option>
              <option value="terminee">⚪ Terminées</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Salle</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Horaire</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Durée</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Montant</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">Aucune réservation trouvée</td></tr>
              ) : (
                filteredBookings.map((booking) => {
                  const status = getStatusBadge(booking.statut);
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{booking.client}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.salle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.heure}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.duree || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {booking.montant > 0 ? `${booking.montant.toLocaleString()} FCFA` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {booking.statut === 'en_attente' && (
                            <>
                              <button onClick={() => handleValidate(booking.id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition" title="Valider">
                                <FiCheckCircle className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleCancel(booking.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition" title="Annuler">
                                <FiXCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Modifier">
                            <FiEdit className="w-5 h-5" />
                          </button>
                          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Détails">
                            <FiEye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-500">Affichage de {filteredBookings.length} sur {allBookings.length} réservations</p>
          <Link to="/receptionist/bookings" className="text-orange-500 hover:text-orange-600 font-medium text-sm">Voir toutes les réservations →</Link>
        </div>
      </div>

      {/* MESSAGES RÉCENTS & ACTIONS RAPIDES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Messages récents</h2>
            <Link to="/receptionist/conversations" className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
              Voir tout <FiEye className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {recentMessages.length > 0 ? (
              recentMessages.map((msg) => (
                <div key={msg.id} className={`p-4 rounded-lg border ${!msg.lu ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{msg.client}</p>
                        {!msg.lu && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">Nouveau</span>}
                      </div>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{msg.date}</p>
                    </div>
                    <button className="text-orange-500 hover:text-orange-600 p-1 rounded-lg hover:bg-orange-50 transition">
                      <FiMessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6">Aucun message</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
          </div>
          <div className="p-4 space-y-3">
            <Link to="/receptionist/bookings" className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 hover:border-orange-200 border border-transparent transition group">
              <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-500 transition">
                <FiCalendar className="w-5 h-5 text-orange-500 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gérer les réservations</p>
                <p className="text-sm text-gray-500">Valider, annuler, modifier</p>
              </div>
            </Link>

            <Link to="/receptionist/conversations" className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 hover:border-orange-200 border border-transparent transition group">
              <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-500 transition">
                <FiMessageSquare className="w-5 h-5 text-green-500 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Messages clients</p>
                <p className="text-sm text-gray-500">Voir et répondre aux messages</p>
              </div>
            </Link>

            <Link to="/receptionist/reports" className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 hover:border-orange-200 border border-transparent transition group">
              <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-500 transition">
                <FiFileText className="w-5 h-5 text-purple-500 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Rapports</p>
                <p className="text-sm text-gray-500">Consulter les statistiques</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceptionistDashboard;