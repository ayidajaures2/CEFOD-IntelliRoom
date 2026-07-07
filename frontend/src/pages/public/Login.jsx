// src/pages/public/Login.jsx
import LoginForm from '../../components/forms/LoginForm';

function Login() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <div className="hidden lg:flex md:flex justify-center items-center bg-black p-8 md:w-2/5 lg:w-2/4">
        <img
          src="/small-logo-black.jpeg"
          alt="Logo CEFOD IntelliRoom"
          className="w-full h-auto object-contain max-h-[60vh]"
        />
      </div>
      <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col items-center justify-center p-6 md:p-8">
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;