
import { Link } from 'react-router-dom';
import {
  FaPlusCircle,
  FaTrashAlt,
  FaUsers,
  FaEdit,
  FaLayerGroup,
  FaTrophy,
  FaEye,
  FaHome,
  FaUserCheck,
  FaCalendarAlt,
  FaRandom,
  FaBolt,
  FaFlagCheckered,
  FaClock,
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
        </div>

        <div className="space-y-6">
          {/* 1. Creación del Torneo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaPlusCircle className="text-blue-500" /> 1. Creación del Torneo
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Desde el Panel Principal (Dashboard), haz clic en <strong>"Crear nuevo torneo"</strong>. Se abrirá un asistente de 3 pasos:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Paso 1 — Información Básica:</strong> Asigna un nombre
                  al torneo, selecciona su ubicación (estado de la República
                  Mexicana) y añade una descripción opcional.
                </li>
                <li>
                  <strong>Paso 2 — Categorías y Eventos:</strong> Selecciona
                  hasta 10 categorías entre los 12 eventos WCA predefinidos
                  (3x3, 2x2, 4x4, etc.) o crea categorías personalizadas. Para
                  cada una elige el formato:{' '}
                  <strong>WCA</strong> (promedios ao5/ao3, rondas múltiples) o{' '}
                  <strong>Red Bull</strong> (brackets de eliminación directa,
                  con o sin ronda de clasificación). En la sub-fase de configuración
                  defines el horario, número de rondas, formato de cada ronda y
                  cuántos competidores avanzan a la siguiente.
                </li>
                <li>
                  <strong>Paso 3 — Competidores:</strong> Ingresa los nombres de
                  los competidores y marca en qué categorías participan. Puedes
                  agregar filas según necesites. El sistema detecta nombres
                  duplicados.
                </li>
              </ul>
              <p className="mt-2">
                Al presionar <strong>"Finalizar y Crear"</strong> el torneo se
                guarda y serás redirigido al panel del torneo.
              </p>
            </div>
          </div>

          {/* 2. Panel del Torneo y Navegación */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaHome className="text-teal-500" /> 2. Panel del Torneo y Navegación
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Una vez dentro de un torneo, el menú lateral izquierdo organiza
                todas las herramientas en cinco secciones:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Inicio</strong> — Panel principal con resumen del torneo.</li>
                <li>
                  <strong>Administrar Competidores</strong> — Competidores, Roles
                  de competencia y Generador de Horarios (grupos).
                </li>
                <li>
                  <strong>Administrar Categorías</strong> — Categorías,
                  Cronograma y Generador de Mezclas (scrambles).
                </li>
                <li><strong>Gestionar Resultados</strong> — Entrada de tiempos (WCA y Red Bull).</li>
                <li><strong>Ver Resultados</strong> — Vista pública de resultados.</li>
              </ul>
              <p className="mt-2">
                El torneo tiene tres <strong>estados</strong> que controlan qué
                puedes hacer:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Próximamente</strong> — El torneo aún no comienza.
                  Puedes editar información general pero no subir resultados ni
                  generar scrambles.
                </li>
                <li>
                  <strong>Activo</strong> — Modo normal. Todas las funciones
                  están habilitadas.
                </li>
                <li>
                  <strong>Finalizado</strong> — Modo de solo lectura. Se bloquean
                  todas las ediciones, eliminaciones y carga de resultados. Para
                  revertirlo debes reactivar el torneo desde el modo edición.
                </li>
              </ul>
              <p className="mt-2">
                Para editar cualquier dato del torneo activa el{' '}
                <strong>Modo Edición</strong> (botón azul "Editar" en la esquina
                superior derecha del panel). Mientras esté activo puedes cambiar
                nombre, descripción, fecha, ubicación, logo y estado del torneo.
                Los cambios se aplican al presionar <strong>"Guardar"</strong>.
              </p>
              <div className="mt-2 text-red-400 border-l-4 border-red-500 pl-3">
                <p className="flex items-center gap-2 font-medium">
                  <FaTrashAlt /> Eliminar un Torneo:
                </p>
                <p>
                  En el modo edición del panel principal aparece un botón rojo
                  "Eliminar Torneo". Para confirmar deberás escribir el nombre
                  exacto del torneo. Esta acción es{' '}
                  <strong>irreversible</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Gestión de Competidores */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-green-500" /> 3. Gestión de Competidores
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                En la sección <strong>Competidores</strong> (dentro de
                Administrar Competidores) puedes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Añadir:</strong> Usa el formulario superior para
                  nombrar al competidor y seleccionar en qué categorías
                  competirá. Haz clic en "Agregar Competidor".
                </li>
                <li>
                  <strong>Buscar y filtrar:</strong> Utiliza la barra de
                  búsqueda por nombre y el filtro por categoría para encontrar
                  competidores rápidamente.
                </li>
                <li>
                  <strong>Modo Edición <FaEdit className="inline" />:</strong>{' '}
                  Al activarlo, podrás editar el nombre de un competidor,
                  cambiar las casillas de las categorías en las que participa o
                  eliminarlo de la lista. Los cambios deben guardarse antes de
                  salir.
                </li>
              </ul>
              <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-2">
                *Nota: Si el torneo está finalizado, esta sección queda
                bloqueada. Debes reactivar el torneo para hacer cambios.
              </p>
            </div>
          </div>

          {/* 4. Roles de Competencia (Staffing) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUserCheck className="text-amber-500" /> 4. Roles de Competencia (Staffing)
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                En la sección <strong>Roles de competencia</strong> (dentro de
                Administrar Competidores) asignas tareas a los competidores para
                cada categoría:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Judge:</strong> Juez que cronometra y verifica los
                  intentos de otros competidores.
                </li>
                <li>
                  <strong>Runner:</strong> Corre de la mesa al área de cómputo
                  entregando tarjetas de tiempos.
                </li>
                <li>
                  <strong>Scrambler:</strong> Aplica las mezclas oficiales a los
                  cubos antes de cada intento.
                </li>
              </ul>
              <p className="mt-2">
                Selecciona una categoría arriba, luego activa el modo edición y
                marca los roles para cada competidor. Un competidor puede tener
                distintos roles en distintas categorías. Esta asignación{' '}
                <strong>es necesaria para que el Generador de Horarios</strong>{' '}
                distribuya automáticamente al staff en los grupos.
              </p>
            </div>
          </div>

          {/* 5. Categorías y Rondas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaLayerGroup className="text-purple-500" /> 5. Categorías y Rondas
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                En la sección <strong>Categorías</strong> (dentro de Administrar
                Categorías) gestionas los eventos del torneo. Máximo 10
                categorías activas. Cada categoría se muestra como una tarjeta
                con su nombre, formato, horario y rondas.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Agregar Categoría:</strong> Usa el selector de eventos
                  WCA o escribe un nombre personalizado. Elige el formato:{' '}
                  <strong>WCA</strong> (rondas con ao3/ao5) o{' '}
                  <strong>Red Bull</strong> (brackets).
                </li>
                <li>
                  <strong>Configurar rondas (WCA):</strong> Define cuántas
                  rondas tendrá la categoría, el formato de cada una (ao5 o
                  ao3) y cuántos competidores avanzan de una ronda a la
                  siguiente ({'"todos"'} si es ronda final).
                </li>
                <li>
                  <strong>Configurar Red Bull:</strong> Elige el modo de bracket
                  (Aleatorio — el sistema sortea posiciones — o Manual — tú
                  asignas cada enfrentamiento). Puedes habilitar una ronda de
                  seeding preliminar (ao3/ao5) para ordenar a los competidores
                  antes del bracket.
                </li>
                <li>
                  <strong>Modo Edición:</strong> Permite cambiar nombre, formato,
                  horario, rondas o eliminar la categoría. Eliminar una
                  categoría la desasigna de todos los competidores.
                </li>
              </ul>
              <p className="text-gray-500 dark:text-gray-400 italic text-sm mt-2">
                *Nota: No se permiten nombres duplicados. Cambiar el formato
                de WCA a Red Bull (o viceversa) borrará los resultados
                existentes de esa categoría.
              </p>
            </div>
          </div>

          {/* 6. Cronograma (Schedule) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-indigo-500" /> 6. Cronograma (Schedule)
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                En la sección <strong>Cronograma</strong> (dentro de Administrar
                Categorías) tienes una línea de tiempo visual tipo Gantt donde
                cada categoría es una barra horizontal.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Modo Edición:</strong> Arrastra las barras para mover
                  bloques de horario, o redimensiónalos desde los bordes
                  superior/inferior. Haz clic en una barra para editar hora
                  inicio, hora fin y sala desde un popup.
                </li>
                <li>
                  <strong>Salas (Rooms):</strong> Puedes crear, renombrar y
                  eliminar salas. Asigna cada categoría a una sala distinta.
                </li>
                <li>
                  <strong>Conflictos:</strong> Si dos categorías se solapan en
                  la misma sala, se resaltan en amarillo para que ajustes los
                  horarios manualmente.
                </li>
              </ul>
              <p className="mt-2">
                Debajo de la línea de tiempo hay una tabla con los horarios
                exactos de cada categoría (inicio, fin, duración, sala).
              </p>
            </div>
          </div>

          {/* 7. Grupos y Mezclas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaRandom className="text-cyan-500" /> 7. Grupos y Mezclas (Scrambles)
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p className="font-medium">Generador de Horarios (Grupos)</p>
              <p>
                En el <strong>Generador de Horarios</strong> (dentro de
                Administrar Competidores) creas los grupos de competencia para
                cada ronda. Solo aplica a categorías WCA.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Selecciona categoría, ronda y número de estaciones/mesas.</li>
                <li>
                  El sistema reparte aleatoriamente a los competidores en
                  grupos, calcula franjas horarias dentro del tiempo de la
                  categoría y asigna staff (jueces, runners, scramblers) según
                  los roles definidos en Staffing.
                </li>
                <li>
                  Para rondas posteriores a la primera, solo se incluyen los
                  competidores que avanzaron según los resultados de la ronda
                  anterior.
                </li>
                <li>
                  Puedes eliminar los grupos y regenerarlos. Si ya hay
                  scrambles generados, se te advertirá.
                </li>
              </ul>

              <p className="font-medium mt-3">Generador de Mezclas (Scrambles)</p>
              <p>
                En el <strong>Generador de Mezclas</strong> (dentro de
                Administrar Categorías) generas las secuencias oficiales de
                mezclado. Usa el motor csTimer mediante un Web Worker.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Selecciona categoría y ronda. Las mezclas se generan por
                  grupo si hay grupos creados, o de forma unificada si no los
                  hay.
                </li>
                <li>
                  <strong>AO5:</strong> 7 mezclas (5 oficiales + 2 extras).{' '}
                  <strong>AO3:</strong> 5 mezclas (3 oficiales + 2 extras).
                </li>
                <li>
                  Cada mezcla muestra la notación en texto y una visualización
                  SVG del cubo. Puedes eliminar y regenerar las mezclas en
                  cualquier momento.
                </li>
                <li>
                  Las categorías Red Bull <strong>no requieren grupos</strong>{' '}
                  previos para generar scrambles.
                </li>
              </ul>
            </div>
          </div>

          {/* 8. Resultados WCA */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" /> 8. Edición de Resultados (WCA)
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                En <strong>Gestionar Resultados</strong>, pestaña "Formato WCA",
                selecciona categoría y ronda para ingresar tiempos.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Entrada de tiempos:</strong> Activa el modo edición y
                  haz clic en la celda de tiempo de un competidor (T1, T2...).
                  Ingresa el tiempo en segundos (
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">11.45</code>),
                  en formato{' '}
                  <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">M:SS.CC</code> o
                  como número entero (987 → 9.87).
                </li>
                <li>
                  <strong>Penalizaciones:</strong> Cada tiempo tiene botones{' '}
                  <strong>+2</strong> y <strong>DNF</strong>. Úsalos si el juez
                  aplicó una penalización sobre ese intento.
                </li>
                <li>
                  <strong>Cálculo automático:</strong> Al guardar se recalcula
                  el mejor tiempo (best), el peor y el promedio oficial según el
                  formato de la ronda:
                  <ul className="list-disc pl-5 mt-1">
                    <li>
                      <strong>AO5:</strong> se eliminan el mejor y peor tiempo,
                      se promedian los 3 restantes. Con 2+ DNF el promedio es
                      DNF.
                    </li>
                    <li>
                      <strong>AO3:</strong> se promedian los 3 tiempos. 1 DNF
                      = promedio DNF.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Avance entre rondas:</strong> Los competidores se
                  ordenan por promedio (menor es mejor). Solo los primeros N
                  (según el valor "competitorsToAdvance" de la ronda) aparecerán
                  en la ronda siguiente.
                </li>
              </ul>
            </div>
          </div>

          {/* 9. Resultados Red Bull */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaBolt className="text-red-500" /> 9. Resultados Red Bull
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                En <strong>Gestionar Resultados</strong>, pestaña "Red Bull",
                manejas el bracket de eliminación directa:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Generar Bracket:</strong> El sistema crea el árbol de
                  enfrentamientos. En modo <strong>Aleatorio</strong> sortea las
                  posiciones. En modo <strong>Manual</strong> tú arrastras a
                  cada competidor a su lugar en la llave. El bracket se
                  dimensiona a la potencia de 2 más cercana, asignando{' '}
                  <em>byes</em> a quienes avanzan automáticamente.
                </li>
                <li>
                  <strong>Ronda de Seeding (opcional):</strong> Si la categoría
                  tiene seeding habilitado, aparecerá una sección adicional para
                  ingresar tiempos preliminares (ao3 o ao5). El ranking
                  resultante determina la siembra en el bracket.
                </li>
                <li>
                  <strong>Editar matches:</strong> Cada enfrentamiento es al
                  mejor de 3 (first to 2). Ingresas 3 tiempos por competidor.
                  El sistema compara cada ronda: el tiempo más rápido gana el
                  punto. El ganador del match se determina automáticamente.
                </li>
                <li>
                  <strong>Auto-avance:</strong> Cuando todos los matches de una
                  ronda tienen ganador, los vencedores (junto con los byes)
                  avanzan automáticamente a la siguiente ronda.
                </li>
              </ul>
            </div>
          </div>

          {/* 10. Visualización Pública y Finalización */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFlagCheckered className="text-emerald-500" /> 10. Visualización Pública y Finalización
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p className="font-medium">Ver Resultados</p>
              <p>
                La sección <strong>Ver Resultados</strong> del menú lateral
                ofrece una vista de solo lectura para proyectar o compartir:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>WCA:</strong> Tabla de posiciones con tiempos,
                  penalizaciones, mejor tiempo y promedio. Adaptada a escritorio
                  (tabla) y móvil (tarjetas apiladas). Usa los selectores de
                  categoría y ronda para navegar.
                </li>
                <li>
                  <strong>Red Bull:</strong> Árbol del bracket con los
                  resultados de cada match, ganadores resaltados y byes
                  indicados. Incluye la tabla de seeding si aplica.
                </li>
              </ul>
              <p className="mt-2">
                También puedes acceder rápidamente desde las tarjetas de
                categoría en la página de inicio del torneo.
              </p>

              <div className="mt-3 pt-3 border-t dark:border-gray-700 border-gray-200">
                <p className="font-medium flex items-center gap-2">
                  <FaClock className="text-gray-500" /> Finalizar el Torneo
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>
                    Ve al <strong>Panel del Torneo</strong> (Inicio) y activa el
                    modo edición.
                  </li>
                  <li>
                    Haz clic en el botón <strong>"Final."</strong> en la
                    sección de estado. Confirma en el modal.
                  </li>
                  <li>
                    El torneo pasa a estado <strong>Finalizado</strong>. Todas
                    las secciones muestran un banner de solo lectura y se
                    deshabilitan las ediciones, eliminaciones y carga de
                    resultados.
                  </li>
                  <li>
                    Para revertirlo, vuelve a activar el modo edición y cambia
                    el estado de vuelta a <strong>Activo</strong>.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
