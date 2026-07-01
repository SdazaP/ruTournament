import { useNavigate } from 'react-router-dom';
import Logo from '../images/logo/logo.png'; // Asegúrate de que esta ruta es correcta
import { FaGithub } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-4">
      {/* Encabezado */}
      <div className="text-center mb-12">
        <h1 className="lg:text-6xl text-4xl font-bold mb-4 text-gray-900 dark:text-white">ruTournaments</h1>
        <p className="text-gray-500 dark:text-bodydark1">Sistema de gestión de torneos de cubo rubik</p>
      </div>

      <div className="mb-12">
        <img 
          src={Logo} 
          alt="Logo ruTournaments" 
          className="w-70 h-70 object-contain invert dark:invert-0"
        />
      </div>

      <button
        onClick={handleGoToDashboard}
        className="bg-meta-5 hover:bg-opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Acceder al Dashboard
      </button>

      <div className="mt-16 text-center text-gray-400 dark:text-bodydark2 flex flex-col items-center">
        <p className="mb-2">© {new Date().getFullYear()} ruTournaments - Sebastian Daza Pérez</p>
        <p className="text-sm">Sistema de gestión de torneos competitivos de cubo rubik</p>
        <a 
          href="https://github.com/SdazaP" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors duration-300"
          title="Visitar el GitHub del creador"
        >
          <FaGithub size={24} />
        </a>
      </div>
    </div>
  );
};

export default HomePage;