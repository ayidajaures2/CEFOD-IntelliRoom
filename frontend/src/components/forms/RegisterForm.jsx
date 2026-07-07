// src/components/forms/RegisterForm.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function RegisterForm() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth(); // ← CHANGÉ
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await register(form); // ← CHANGÉ
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error(err.response?.data);
      setError(err.response?.data?.message || "Erreur d'inscription");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col items-center justify-center space-y-4">
      <h2 className="text-4xl font-bold text-white drop-shadow-lg">Créer un compte</h2>
      <p className="text-sm text-orange-400/80 mt-2">Remplissez vos informations ci-dessous</p>

      {/* Nom */}
      <div className="flex items-center w-full bg-black/40 border border-gray-700 rounded-full overflow-hidden pl-6 gap-2 transition-all duration-300 focus-within:shadow-[0_0_12px_#f97316] focus-within:border-orange-500">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#f97316"/>
        </svg>
        <input 
          name="nom" 
          type="text" 
          placeholder="Nom" 
          value={form.nom} 
          onChange={handleChange} 
          className="bg-transparent text-white placeholder-gray-500 outline-none text-sm w-full h-12" 
          required 
        />
      </div>

      {/* Prénom */}
      <div className="flex items-center w-full bg-black/40 border border-gray-700 rounded-full overflow-hidden pl-6 gap-2 transition-all duration-300 focus-within:shadow-[0_0_12px_#f97316] focus-within:border-orange-500">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#f97316"/>
        </svg>
        <input 
          name="prenom" 
          type="text" 
          placeholder="Prénom" 
          value={form.prenom} 
          onChange={handleChange} 
          className="bg-transparent text-white placeholder-gray-500 outline-none text-sm w-full h-12" 
          required 
        />
      </div>

      {/* Email */}
      <div className="flex items-center w-full bg-black/40 border border-gray-700 rounded-full overflow-hidden pl-6 gap-2 transition-all duration-300 focus-within:shadow-[0_0_12px_#f97316] focus-within:border-orange-500">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#f97316"/>
        </svg>
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          value={form.email} 
          onChange={handleChange} 
          className="bg-transparent text-white placeholder-gray-500 outline-none text-sm w-full h-12" 
          required 
        />
      </div>

      {/* Téléphone (optionnel) */}
      <div className="flex items-center w-full bg-black/40 border border-gray-700 rounded-full overflow-hidden pl-6 gap-2 transition-all duration-300 focus-within:shadow-[0_0_12px_#f97316] focus-within:border-orange-500">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.24 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="#f97316"/>
        </svg>
        <input 
          name="telephone" 
          type="tel" 
          placeholder="Téléphone (optionnel)" 
          value={form.telephone} 
          onChange={handleChange} 
          className="bg-transparent text-white placeholder-gray-500 outline-none text-sm w-full h-12" 
        />
      </div>

      {/* Mot de passe */}
      <div className="flex items-center w-full bg-black/40 border border-gray-700 rounded-full overflow-hidden pl-6 gap-2 transition-all duration-300 focus-within:shadow-[0_0_12px_#f97316] focus-within:border-orange-500">
        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#f97316"/>
        </svg>
        <input 
          name="password" 
          type="password" 
          placeholder="Mot de passe" 
          value={form.password} 
          onChange={handleChange} 
          className="bg-transparent text-white placeholder-gray-500 outline-none text-sm w-full h-12" 
          required 
        />
      </div>

      {/* Confirmation mot de passe */}
      <div className="flex items-center w-full bg-black/40 border border-gray-700 rounded-full overflow-hidden pl-6 gap-2 transition-all duration-300 focus-within:shadow-[0_0_12px_#f97316] focus-within:border-orange-500">
        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#f97316"/>
        </svg>
        <input 
          name="password_confirmation" 
          type="password" 
          placeholder="Confirmer le mot de passe" 
          value={form.password_confirmation} 
          onChange={handleChange} 
          className="bg-transparent text-white placeholder-gray-500 outline-none text-sm w-full h-12" 
          required 
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        className="mt-6 w-full h-11 rounded-full text-white font-semibold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_#f97316]"
      >
        S'inscrire
      </button>

      <p className="text-center mt-4 text-gray-400">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-orange-500 hover:text-orange-400 transition-colors">
          Connectez-vous
        </Link>
      </p>
      <Link to="/" className="text-gray-300 hover:text-white transition-colors">
        Revenir à l'écran d'accueil
      </Link>
    </form>
  );
}

export default RegisterForm;