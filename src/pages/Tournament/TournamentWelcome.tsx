import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type Tournament = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  logo: string | null;
  eventLink?: string;
};

type Participant = {
  id: number;
  name: string;
  category: string;
};

type Category = {
  name: string;
  icon: string;
  participants: number;
};

const TournamentWelcome = () => {
  // Estado del torneo
  const [tournament, setTournament] = useState<Tournament>({
    name: 'Torneo Nacional de Cubos 2023',
    description: 'El mayor evento de speedcubing del año',
    startDate: '2023-11-15',
    endDate: '2023-11-17',
    location: 'Centro de Convenciones, Ciudad',
    logo: null
  });

  // Participantes
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: 'Juan Pérez', category: '3x3' },
    { id: 2, name: 'María García', category: '3x3 OH' },
    { id: 3, name: 'Carlos López', category: '4x4' },
    { id: 4, name: 'Ana Martínez', category: '3x3' },
    { id: 5, name: 'Luis Rodríguez', category: '2x2' },
  ]);

  // Categorías
  const [categories, setCategories] = useState<Category[]>([
    { name: '3x3', icon: '3x3', participants: 2 },
    { name: '4x4', icon: '4x4', participants: 1 },
    { name: '3x3 OH', icon: 'OH', participants: 1 },
    { name: '2x2', icon: '2x2', participants: 1 },
    { name: 'Pyraminx', icon: 'Pyr', participants: 0 },
  ]);

  // Manejar cambio de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTournament({
            ...tournament,
            logo: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar cambios en los campos del torneo
  const handleTournamentChange = (field: keyof Tournament, value: string) => {
    setTournament({
      ...tournament,
      [field]: value
    });
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-2 max-w-7xl mx-auto">
      {/* Encabezado en 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 mt-8">
        {/* Columna 1: Logo con funcionalidad de carga */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative group w-40 h-40 mb-4">
            <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {tournament.logo ? (
                <img 
                  src={tournament.logo} 
                  alt="Logo del torneo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xl">Logo</span>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <div className="text-center p-2">
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs">{tournament.logo ? 'Cambiar' : 'Subir'} logo</span>
              </div>
            </label>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Logo del Torneo</h3>
            <p className="text-sm text-gray-400">Recomendado: 400×400 px</p>
          </div>
        </div>

        {/* Columna 2: Información General */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Información General</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Torneo
              </label>
              <input
                type="text"
                value={tournament.name}
                onChange={(e) => handleTournamentChange('name', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Ej: Torneo Nacional de Cubos 2023"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={tournament.description}
                onChange={(e) => handleTournamentChange('description', e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Describe el propósito y detalles del torneo..."
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 500 caracteres</p>
            </div>
          </div>
        </div>

        {/* Columna 3: Detalles del Evento */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Detalles del Evento</h2>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={tournament.startDate}
                  onChange={(e) => handleTournamentChange('startDate', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={tournament.endDate}
                  onChange={(e) => handleTournamentChange('endDate', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={tournament.location}
                onChange={(e) => handleTournamentChange('location', e.target.value)}
                className="w-full bg-gray-700 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Ej: Centro de Convenciones, Bogotá"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección de categorías y participantes en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna de categorías */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Categorías</h2>
            <Link to="categories" className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700">
              + Añadir categoría
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div 
                key={category.name}
                className="flex flex-col items-center p-3 bg-gray-750 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-2 text-sm">
                  {category.icon}
                </div>
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-xs text-gray-400 mt-1">
                  {category.participants} participantes
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna de participantes */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Participantes</h2>
            <Link to="competitors" className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700">
              + Añadir participante
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium">Nombre</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Categoría</th>
                  <th className="py-3 px-4 text-right text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-750">
                    <td className="py-3 px-4">{participant.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-gray-700 rounded-full px-3 py-1 text-xs">
                        {participant.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 mr-3 text-sm">
                        Editar
                      </button>
                      <button className="text-red-400 hover:text-red-300 text-sm">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentWelcome;