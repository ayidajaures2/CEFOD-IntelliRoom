// src/components/forms/LoginForm.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login(email, password);
      
      console.log('🟢 result:', result); // DEBUG
      console.log('🟢 result.success:', result.success); // DEBUG
      console.log('🟢 result.user:', result.user); // DEBUG
      
      // ✅ SI result.success est true ET result.user existe
      if (result.success && result.user) {
        const role = result.user.role;
        console.log('🟢 Rôle:', role);
        
        if (role === 'admin') navigate('/admin');
        else if (role === 'receptionniste') navigate('/receptionist');
        else if (role === 'caissier') navigate('/cashier');
        else navigate('/dashboard');
      } else {
        // ✅ SI result.success est false OU result.user n'existe pas
        setError(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('🔴 Erreur:', err);
      setError(err.response?.data?.message || 'Erreur de connexion');
    }
  };

  return (
    <form className="md:w-96 w-80 flex flex-col items-center justify-center" onSubmit={handleSubmit}>
      <h2 className="text-4xl text-gray-900 font-black">Sign in</h2>
      <p className="text-sm text-gray-500/90 mt-3">Welcome back! Please sign in to continue</p>

      <div className="flex items-center w-full bg-transparent border border-gray-300 rounded-full overflow-hidden pl-6 gap-2 mt-6 transition-all duration-300 focus-within:border-orange-500 focus-within:shadow-[0_0_8px_#f97316]">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
        </svg>
        <input
          type="email"
          placeholder="Email id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-12"
          required
        />
      </div>

      <div className="flex items-center w-full bg-transparent border border-gray-300 rounded-full overflow-hidden pl-6 gap-2 mt-4 transition-all duration-300 focus-within:border-orange-500 focus-within:shadow-[0_0_8px_#f97316]">
        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
        </svg>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-12"
          required
        />
      </div>

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

      <div className="w-full flex items-center justify-between mt-8 text-gray-500/80">
        <div className="flex items-center gap-2">
          <input className="h-5" type="checkbox" id="checkbox" />
          <label className="text-sm" htmlFor="checkbox">Remember me</label>
        </div>
        <a className="text-sm underline" href="#">Forgot password?</a>
      </div>

      <button
        type="submit"
        className="mt-8 w-full h-11 rounded-full text-white font-semibold bg-orange-500 hover:bg-orange-600 transition-all duration-300 hover:shadow-[0_0_12px_#f97316]"
      >
        Login
      </button>

      <p className="text-center mt-4">
        <Link to="/register" className="text-orange-600 hover:underline">Créer un compte</Link>
      </p>
      <Link to="/" className="text-gray-600 hover:text-black">
        Revenir à l'écran d'accueil
      </Link>
    </form>
  );
}

export default LoginForm;