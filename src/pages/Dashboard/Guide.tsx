
import { Link } from 'react-router-dom';
import { 
  FaPlusCircle, 
  FaTrashAlt, 
  FaUsers, 
  FaEdit, 
  FaLayerGroup, 
  FaTrophy, 
  FaEye 
} from 'react-icons/fa';

const Guide = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center sm:flex-row flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Guía de Uso Rápido
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Aprende paso a paso cómo gestionar tu torneo de Speedcubing en la plataforma.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap text-sm"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="space-y-6">
          {/* Creación y Eliminación de torneo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaPlusCircle className="text-blue-500" /> 1. Creación y Eliminación del Torneo
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                <strong>Crear un Torneo:</strong> Desde el Panel Principal (Dashboard), haz clic en "Crear nuevo torneo". Deberás asignar un nombre al torneo. A continuación, serás llevado al panel de administración del torneo, donde podrás añadir categorías y rondas iniciales.
              </p>
              <div className="mt-2 text-red-400 border-l-4 border-red-500 pl-3">
                <p className="flex items-center gap-2 font-medium">
                  <FaTrashAlt /> Eliminar un Torneo:
                </p>
                <p>
                  Si deseas borrar el torneo completo, ingresa al Panel Principal del Torneo. Activa el <strong>Modo Edición</strong> arriba a la derecha. Aparecerá un botón rojo de "Eliminar Torneo". Para confirmar, deberás escribir el nombre exacto del torneo y aceptar. Esta acción es <strong>irreversible</strong> y borrará todos los participantes y resultados.
                </p>
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-green-500" /> 2. Gestión de Participantes
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Ubícate en la pestaña de <strong>Participantes</strong> dentro del torneo:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Añadir:</strong> Usa el formulario superior para nombrar al participante y seleccionar en qué categorías competirá. Haz clic en "Agregar Participante".</li>
                <li><strong>Modo Edición <FaEdit className="inline" />:</strong> Al activarlo, podrás editar el nombre de un participante o cambiar las casillas de las categorías en las que participa y luego guardar los cambios. Activar la edición también revela el ícono de eliminar, útil si alguien no se presentó.</li>
              </ul>
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaLayerGroup className="text-purple-500" /> 3. Categorías y Eventos
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Dirígete a la pestaña <strong>Categorías</strong>. Tienes un máximo de 10 categorías activas permitidas por torneo.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Agregar Categoría:</strong> Utiliza el selector WCA (ej. 3x3x3, 4x4x4) u oprime "Otros" si es un evento personalizado (ej. Mirror 3x3). Puedes declarar el número de Rondas y el Formato Oficial a usar (ao5: Promedio de 5 o ao3: Promedio de 3).</li>
                <li><strong>Modo Edición:</strong> Si te equivocaste en el nombre de un evento "Otro", o quieres ajustar las Rondas o los participantes que avanzan de una subcategoría en pleno transcurso, activa el modo edición. Podrás editar y posteriormente guardar sobre la lista activa.</li>
              </ul>
              <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-3">
                *Nota: Las categorías no se pueden duplicar. Si intentas agregar la misma, el sistema la rechazará.
              </p>
            </div>
          </div>

          {/* Resultados y Tiempos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" /> 4. Edición de Resultados (WCA)
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Una vez completado el registro, entra a la sección de <strong>Resultados WCA</strong>. Usa los selectores superiores para filtrar por Categoría y Ronda en curso. 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Tiempos Base:</strong> Haciendo clic en habilitar edición, toca el espacio correspondiente al tiempo de la ronda de un concursante (ej. T1, T2...). Ingresa el tiempo numérico en segundos (ej. <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">11.45</code>) en el input.</li>
                <li><strong>Penalizaciones WCA:</strong> Debajo o a un costado del input de tiempo tendrás los botones <strong>+2</strong> y <strong>DNF</strong>. Presiónalos si el juez aplicó una penalización sobre el intento del participante. El mejor tiempo, el peor tiempo, y el Average Oficial se recalcularán solos al apretar "Guardar".</li>
              </ul>
            </div>
          </div>

          {/* Visualización */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaEye className="text-pink-500" /> 5. Visualizar Tablas Públicas
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Puedes compartir o proyectar los resultados a los espectadores visitando los enlaces integrados en las <strong>tarjetas o iconos del panel principal del torneo</strong>.
              </p>
              <p>
                Esta visualización está fuertemente adaptada a teléfonos móviles usando un modo de "cards" apiladas y a monitores o televisores listando una enorme y elegante tabla para que todos sigan la competencia en tiempo real, destacando promedios y posibles DNFs tal y como lo dicta la <em>World Cube Association</em>.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Guide;
