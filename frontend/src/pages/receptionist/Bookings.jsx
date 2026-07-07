// frontend/src/pages/receptionist/Bookings.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { FiEye, FiEdit, FiTrash2, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';

function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/receptionist/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ En attente' },
      validee: { bg: 'bg-blue-100', text: 'text-blue-700', label: '🔵 Validée' },
      confirmee: { bg: 'bg-purple-100', text: 'text-purple-700', label: '🟣 Confirmée' },
      terminee: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Terminée' },
      annulee: { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Annulée' }
    };
    return config[statut] || config.en_attente;
  };

  const filteredBookings = bookings.filter(b => {
    const matchSearch = b.client?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.salle?.libelle_salle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des réservations</h1>
          <p className="text-gray-600 mt-1">Gérez toutes les réservations</p>
        </div>
        <Link
          to="/receptionist/bookings/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          + Nouvelle réservation
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-gray-500">{bookings.length} réservations au total</p>
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
              <option value="en_attente">⏳ En attente</option>
              <option value="validee">🔵 Validées</option>
              <option value="confirmee">🟣 Confirmées</option>
              <option value="terminee">✅ Terminées</option>
              <option value="annulee">❌ Annulées</option>
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
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">Aucune réservation trouvée</td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const status = getStatusBadge(b.statut);
                  return (
                    <tr key={b.id_reservation} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {b.client?.prenom} {b.client?.nom}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{b.salle?.libelle_salle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(b.date_debut).toLocaleDateString()} {new Date(b.date_debut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Détails">
                            <FiEye className="w-5 h-5" />
                          </button>
                          <button className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition" title="Valider">
                            <FiCheckCircle className="w-5 h-5" />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition" title="Annuler">
                            <FiXCircle className="w-5 h-5" />
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
      </div>
    </div>
  );
}

export default Bookings;