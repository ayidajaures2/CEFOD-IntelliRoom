// src/pages/client/Profile.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

function Profile() {
  const { user } = useAuth();

  // Infos du formulaire
  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');

  // Mot de passe
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Mise à jour du profil
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    // Simuler un appel API
    setTimeout(() => {
      setMessage('✅ Profil mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  // Changement de mot de passe
  const handleChangePassword = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('❌ Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('❌ Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setTimeout(() => {
      setMessage('✅ Mot de passe modifié avec succès !');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres du compte</h1>

      {/* Message de succès */}
      {message && (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg mb-4">
          {message}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Section 1 : Informations personnelles */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informations personnelles</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Enregistrer
          </button>
        </form>
      </div>

      {/* Section 2 : Changer le mot de passe */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Changer le mot de passe</h2>
        <form onSubmit={handleChangePassword}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Changer le mot de passe
          </button>
        </form>
      </div>

      {/* Section 3 : Supprimer le compte */}
      <div className="bg-white rounded-lg shadow p-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Supprimer le compte</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cette action est irréversible. Toutes vos données seront supprimées.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) {
              alert('Compte supprimé (simulation)');
            }
          }}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

export default Profile;