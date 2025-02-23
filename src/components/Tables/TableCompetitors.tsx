import React, { useState } from 'react';

const TableCompetitors = () => {
  // Estado para almacenar la lista de competidores
  const [competitors, setCompetitors] = useState([
    { name: '', category: '' }, // Fila inicial vacía
  ]);

  // Función para manejar cambios en los inputs
  const handleInputChange = (index, field, value) => {
    const updatedCompetitors = [...competitors];
    updatedCompetitors[index][field] = value;
    setCompetitors(updatedCompetitors);
  };

  // Función para agregar una nueva fila
  const handleAddRow = () => {
    setCompetitors([...competitors, { name: '', category: '' }]);
  };

  return (
    <div className="rounded-sm border border-stroke bg-gray-900 px-5 pt-6 pb-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
      <div className="flex flex-col">
        {/* Encabezados de la tabla */}
        <div className="grid grid-cols-3 rounded-sm bg-gray-800 dark:bg-meta-4 sm:grid-cols-2">
          <div className="p-2.5 text-center xl:px-20">
            <h5 className="text-sm font-medium uppercase xsm:text-base text-white">
              Competidores
            </h5>
          </div>
          <div className="p-2.5 text-center xl:px-20">
            <h5 className="text-sm font-medium uppercase xsm:text-base text-white">
              Categorías
            </h5>
          </div>
        </div>

        {/* Filas de la tabla */}
        {competitors.map((competitor, index) => (
          <div key={index} className="grid grid-cols-3 sm:grid-cols-2 border-b border-gray-700 dark:border-strokedark">
            {/* Input para el nombre del competidor */}
            <div className="p-2.5 text-center xl:px-20">
            <input
                type="text"
                placeholder="Nombre del competidor"
                value={competitor.name}
                onChange={(e) =>
                  handleInputChange(index, 'name', e.target.value)
                }
                className="w-full rounded-lg border border-gray-600 py-3 px-5 text-white bg-gray-800 outline-none focus:border-blue-500"
              />
            </div>

            {/* Input para la categoría */}
            <div className="p-2.5 text-center xl:px-20">
              <p className="hidden text-white dark:text-white sm:block">
                categoria
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Botón para agregar nueva fila */}
      <div className="flex flex-col items-center justify-center">
        <button
          className="mt-10 px-8 py-3 bg-blue-500 text-white text-lg rounded shadow-md hover:bg-blue-600"
          onClick={handleAddRow}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default TableCompetitors;