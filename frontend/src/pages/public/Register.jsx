// src/pages/public/Register.jsx
import RegisterForm from '../../components/forms/RegisterForm';

function Register() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-black">
      <div className="hidden w-full md:w-2/5 lg:w-1/3 lg:flex md:flex items-center justify-center bg-white p-8">
        <img
          src="/small-logo-white.jpeg"
          alt="Logo CEFOD IntelliRoom"
          className="w-full h-auto object-contain max-h-[80vh]"
        />
      </div>
      <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col items-center justify-center p-6 md:p-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <RegisterForm />
      </div>
    </div>
  );
}

export default Register;