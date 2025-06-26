import { useNavigate } from 'react-router-dom';
import Logo from '../images/logo/logo.png'; // Asegúrate de que esta ruta es correcta

const HomePage = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      {/* Encabezado */}
      <div className="text-center mb-12">
        <h1 className="lg:text-6xl text-4xl font-bold mb-4">ruTournaments</h1>
        <p className="text-bodydark1">Sistema de gestión de torneos de cubo rubik</p>
      </div>

      <div className="mb-12">
        <img 
          src={Logo} 
          alt="Logo ruTournaments" 
          className="w-70 h-70 object-contain"
        />
      </div>

      <button
        onClick={handleGoToDashboard}
        className="bg-meta-5 hover:bg-opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
      >
        Acceder al Dashboard
      </button>

      <div className="mt-16 text-center text-bodydark2">
        <p className="mb-2">© {new Date().getFullYear()} ruTournaments</p>
        <p className="text-sm">Sistema de gestión de torneos competitivos de cubo rubik</p>
      </div>
    </div>
  );
};

export default HomePage;