// src/pages/admin/ManageUsers.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiShield,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUserCheck,
  FiUserX,
  FiX,
  FiSave,
  FiUserPlus,
} from 'react-icons/fi';

function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    password_confirmation: '',
    role: 'client'
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage }
      });

      setUsers(response.data.data || response.data);
      if (response.data.last_page) {
        setTotalPages(response.data.last_page);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchTerm, role: filterRole }
      });
      setUsers(response.data.data || response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm || filterRole !== 'all') {
      handleSearch();
    }
  }, [searchTerm, filterRole]);

  const getRoleBadge = (role) => {
    const config = {
      admin: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: '🛡️' },
      receptionniste: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '👩‍💼' },
      caissier: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: '💰' },
      client: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: '👤' }
    };
    return config[role] || config.client;
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      password: '',
      password_confirmation: '',
      role: 'client'
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      nom: u.nom || '',
      prenom: u.prenom || '',
      email: u.email || '',
      telephone: u.telephone || '',
      password: '',
      password_confirmation: '',
      role: u.role || 'client'
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id_utilisateur}` 
        : '/api/admin/users';
      const method = editingUser ? 'put' : 'post';

      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormSuccess(editingUser ? '✅ Utilisateur modifié avec succès !' : '✅ Utilisateur créé avec succès !');
      
      setTimeout(() => {
        setShowModal(false);
        fetchUsers();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('❌ Erreur lors de la suppression de l\'utilisateur');
      console.error(err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('❌ Erreur lors du changement de rôle');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        <p className="mt-4 text-white">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">❌ {error}</p>
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
    <div className="space-y-6">
      {/* EN-TÊTE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des utilisateurs</h1>
          <p className="text-orange-300/70 mt-1">Gérez tous les utilisateurs du système</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 px-4 py-2 rounded-xl border border-orange-500/30 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition shadow-lg hover:shadow-orange-500/30"
          >
            <FiUserPlus className="w-4 h-4" />
            Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* FILTRES ET RECHERCHE */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-orange-500/20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 text-white placeholder-orange-300/50"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 border border-orange-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/10 text-white"
          >
            <option value="all" className="text-gray-900">Tous les rôles</option>
            <option value="admin" className="text-gray-900">🛡️ Admin</option>
            <option value="receptionniste" className="text-gray-900">👩‍💼 Réceptionniste</option>
            <option value="caissier" className="text-gray-900">💰 Caissier</option>
            <option value="client" className="text-gray-900">👤 Client</option>
          </select>
        </div>
      </div>

      {/* TABLEAU DES UTILISATEURS */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-sm border border-orange-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-500/10 border-b border-orange-500/20">
              <tr>
                <th className="text-left px-4 py-3.5 text-sm font-semibold text-orange-300">Utilisateur</th>
                <th className="text-left px-4 py-3.5 text-sm font-semibold text-orange-300">Email</th>
                <th className="text-left px-4 py-3.5 text-sm font-semibold text-orange-300">Téléphone</th>
                <th className="text-left px-4 py-3.5 text-sm font-semibold text-orange-300">Rôle</th>
                <th className="text-left px-4 py-3.5 text-sm font-semibold text-orange-300">Date d'inscription</th>
                <th className="text-center px-4 py-3.5 text-sm font-semibold text-orange-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-500/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-orange-300/50">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const role = getRoleBadge(u.role);
                  return (
                    <tr key={u.id_utilisateur} className="hover:bg-orange-500/5 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-semibold">
                            {u.prenom?.charAt(0)}{u.nom?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{u.prenom} {u.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-orange-200/70">
                        <span className="flex items-center gap-1.5">
                          <FiMail className="w-3.5 h-3.5 text-orange-400" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-orange-200/70">
                        {u.telephone ? (
                          <span className="flex items-center gap-1.5">
                            <FiPhone className="w-3.5 h-3.5 text-orange-400" />
                            {u.telephone}
                          </span>
                        ) : (
                          <span className="text-orange-400/50">Non renseigné</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${role.bg} ${role.text}`}>
                            {role.icon} {u.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-orange-200/70">
                        <span className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5 text-orange-400" />
                          {new Date(u.date_creation).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              const roles = ['admin', 'receptionniste', 'caissier', 'client'];
                              const currentIndex = roles.indexOf(u.role);
                              const nextRole = roles[(currentIndex + 1) % roles.length];
                              handleRoleChange(u.id_utilisateur, nextRole);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                            title="Changer de rôle"
                          >
                            <FiShield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 text-orange-400 hover:bg-orange-500/20 rounded-lg transition"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id_utilisateur, `${u.prenom} ${u.nom}`)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
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

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-orange-500/20 flex items-center justify-between">
            <p className="text-sm text-orange-300/70">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-500/10 transition disabled:opacity-50 text-orange-300"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-500/10 transition disabled:opacity-50 text-orange-300"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-orange-500/30">
            <div className="sticky top-0 bg-gray-900 border-b border-orange-500/20 p-4 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-orange-500/10 rounded-lg transition"
              >
                <FiX className="w-5 h-5 text-orange-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder-orange-300/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">Prénom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder-orange-300/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder-orange-300/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder-orange-300/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">Rôle <span className="text-red-500">*</span></label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white"
                >
                  <option value="client" className="text-gray-900">👤 Client</option>
                  <option value="receptionniste" className="text-gray-900">👩‍💼 Réceptionniste</option>
                  <option value="caissier" className="text-gray-900">💰 Caissier</option>
                  <option value="admin" className="text-gray-900">🛡️ Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">
                  {editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder={editingUser ? 'Laisser vide pour ne pas modifier' : ''}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder-orange-300/50"
                  required={!editingUser}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-300 mb-1">
                  Confirmer le mot de passe {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/5 text-white placeholder-orange-300/50"
                  required={!editingUser && !!formData.password}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-orange-500/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-500/10 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      {editingUser ? 'Modifier' : 'Ajouter'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;