import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, ScrambleRecord } from '../../common/db';
import { FaSyncAlt, FaInfoCircle, FaTrash } from 'react-icons/fa';
import { MdCategory, MdOutlineTimer } from 'react-icons/md';

// ─── Tipos locales ───────────────────────────────────────────────────────────

type Group = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  scrambles?: ScrambleRecord[];
};

type Round = {
  roundNumber: number;
  format: 'ao3' | 'ao5';
  isFinal?: boolean;
  scrambles?: ScrambleRecord[];
  groups?: Group[];
};

type Category = {
  id: string;
  name: string;
  format: string;
  rounds: Round[];
};

// ─── Mapa de eventos WCA ────────────────────────────────────────────────────
// [cstimerType, scrambleLength (0 = default)]
const wcaEventMap: Record<string, [string, number]> = {
  '3x3': ['333', 0],
  '2x2': ['222so', 0],
  '4x4': ['444wca', 0],
  '5x5': ['555wca', 60],
  '6x6': ['666wca', 80],
  '7x7': ['777wca', 100],
  '3x3 OH': ['333', 0],
  '3x3 BLD': ['333ni', 0],
  '3x3 FM': ['333fm', 0],
  'Clock': ['clkwca', 0],
  'Megaminx': ['mgmp', 70],
  'Pyraminx': ['pyrso', 10],
  'Skewb': ['skbso', 0],
  'Square-1': ['sqrs', 0],
  '4x4 BLD': ['444bld', 40],
  '5x5 BLD': ['555bld', 60],
};

// ─── Hook: csTimer Web Worker ────────────────────────────────────────────────
// Según la documentación oficial, la única forma de usar cstimer_module
// en el navegador sin jQuery es cargarlo como Web Worker.

function useCstimerWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Record<number, (result: string) => void>>({});
  const msgIdRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // El archivo está en /public/cstimer_module.js → URL absoluta
    const worker = new Worker('/cstimer_module.js');

    worker.onmessage = (e: MessageEvent) => {
      const [id, , result] = e.data as [number, string, string];
      const cb = callbacksRef.current[id];
      if (cb) {
        delete callbacksRef.current[id];
        cb(result);
      }
    };

    worker.onerror = (err) => {
      console.error('[csTimer Worker Error]', err);
    };

    workerRef.current = worker;
    setReady(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const call = useCallback(
    (type: string, details?: unknown[]): Promise<string> =>
      new Promise((resolve) => {
        if (!workerRef.current) return;
        const id = ++msgIdRef.current;
        callbacksRef.current[id] = resolve;
        workerRef.current.postMessage([id, type, details]);
      }),
    [],
  );

  const getScramble = useCallback(
    (scrType: string, length = 0) => call('scramble', [scrType, length]),
    [call],
  );

  const getImage = useCallback(
    (scramble: string, scrType: string) => call('image', [scramble, scrType]),
    [call],
  );

  return { ready, getScramble, getImage };
}

// ─── Componente principal ────────────────────────────────────────────────────

const Scrambles = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ready, getScramble, getImage } = useCstimerWorker();

  const [showGroupAlert, setShowGroupAlert] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Cargar categorías desde la BD
  useEffect(() => {
    if (!id) return;
    db.tournaments.get(id).then((t) => {
      if (!t?.categories) return;

      const formatted: Category[] = t.categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        format: c.format,
        rounds: (c.rounds ?? []).map((r: any) => ({
          roundNumber: r.num,
          format: r.format as 'ao3' | 'ao5',
          isFinal: r.isFinal ?? false,
          scrambles: r.scrambles ?? [],
          groups: (r.groups ?? []).map((g: any) => ({
            id: g.id,
            name: g.name,
            startTime: g.startTime,
            endTime: g.endTime,
            scrambles: g.scrambles ?? []
          }))
        })),
      }));

      setCategories(formatted);

      if (formatted.length > 0) {
        setSelectedCategory(formatted[0].id);
        if (formatted[0].rounds.length > 0) {
          setSelectedRound(formatted[0].rounds[0].roundNumber);
        }
      }
    });
  }, [id]);

  // Derivados del estado seleccionado
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentRoundObj = currentCategoryObj?.rounds.find(
    (r) => r.roundNumber === selectedRound,
  );

  // ── Generar mezclas ──────────────────────────────────────────────────────
  const handleGenerateScrambles = async () => {
    if (!currentCategoryObj || !currentRoundObj || !id || !ready) return;

    if (!currentRoundObj.groups || currentRoundObj.groups.length === 0) {
      setShowGroupAlert(true);
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const mapping = wcaEventMap[currentCategoryObj.name] ?? ['333', 0];
    const [scType, scLength] = mapping;

    // ao5 → 5 oficiales + 2 extra = 7 | ao3 → 3 + 2 = 5
    const scramblesPerGroup = currentRoundObj.format === 'ao5' ? 7 : 5;
    const groupsCount = currentRoundObj.groups.length;
    const totalScramblesToGenerate = scramblesPerGroup * groupsCount;

    try {
      const generatedGroups: Group[] = [];
      let globalCounter = 0;

      for (let g = 0; g < groupsCount; g++) {
        const newScrambles: ScrambleRecord[] = [];
        for (let i = 0; i < scramblesPerGroup; i++) {
          const text = await getScramble(scType, scLength);
          const rawSvg = await getImage(text, scType);

          const wMatch = rawSvg.match(/ width="(\d+)"/);
          const hMatch = rawSvg.match(/ height="(\d+)"/);
          const svgW = wMatch ? wMatch[1] : '396';
          const svgH = hMatch ? hMatch[1] : '296';

          const svg = rawSvg
            .replace(/ width="[^"]*"/, '')
            .replace(/ height="[^"]*"/, '')
            .replace('<svg', `<svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;height:auto;display:block;"`);

          newScrambles.push({ text, svg });

          globalCounter++;
          setProgress(Math.round((globalCounter / totalScramblesToGenerate) * 100));
        }

        const baseGroup = currentRoundObj.groups[g];
        generatedGroups.push({ ...baseGroup, scrambles: newScrambles });
      }

      // Persistir en la BD
      const tournament = await db.tournaments.get(id);
      if (tournament) {
        const catIdx = tournament.categories.findIndex((c: any) => c.id === selectedCategory);
        if (catIdx >= 0) {
          const rndIdx = tournament.categories[catIdx].rounds.findIndex(
            (r: any) => r.num === selectedRound,
          );
          if (rndIdx >= 0) {
            if (tournament.categories[catIdx].rounds[rndIdx].groups) {
              tournament.categories[catIdx].rounds[rndIdx].groups = tournament.categories[catIdx].rounds[rndIdx].groups.map((dbG: any) => {
                const match = generatedGroups.find(gg => gg.id === dbG.id);
                if (match) return { ...dbG, scrambles: match.scrambles };
                return dbG;
              });
            }
            await db.tournaments.put(tournament);
          }
        }
      }

      // Actualizar estado local
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== selectedCategory) return c;
          return {
            ...c,
            rounds: c.rounds.map((r) => {
              if (r.roundNumber !== selectedRound) return r;
              return { ...r, groups: generatedGroups };
            }),
          };
        }),
      );
    } catch (err) {
      console.error(err);
      alert('Error al generar las mezclas. Verifica la consola del navegador.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // ── Eliminar mezclas ─────────────────────────────────────────────────────
  const handleDeleteScrambles = async () => {
    if (!id || !currentCategoryObj || !currentRoundObj) return;
    if (!confirm('¿Seguro que deseas eliminar estas mezclas de todos los grupos?')) return;

    const tournament = await db.tournaments.get(id);
    if (tournament) {
      const catIdx = tournament.categories.findIndex((c: any) => c.id === selectedCategory);
      if (catIdx >= 0) {
        const rndIdx = tournament.categories[catIdx].rounds.findIndex(
          (r: any) => r.num === selectedRound,
        );
        if (rndIdx >= 0) {
          if (tournament.categories[catIdx].rounds[rndIdx].groups) {
            tournament.categories[catIdx].rounds[rndIdx].groups = tournament.categories[catIdx].rounds[rndIdx].groups.map((g: any) => ({ ...g, scrambles: [] }));
          }
          await db.tournaments.put(tournament);
        }
      }
    }

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== selectedCategory) return c;
        return {
          ...c,
          rounds: c.rounds.map((r) => {
            if (r.roundNumber !== selectedRound) return r;
            return {
              ...r,
              groups: (r.groups ?? []).map(g => ({ ...g, scrambles: [] }))
            };
          }),
        };
      }),
    );
  };

  // ─── Renderizado ──────────────────────────────────────────────────────────
  const hasScrambles = (currentRoundObj?.groups ?? []).some(g => (g.scrambles?.length ?? 0) > 0);
  const officialCount = currentRoundObj?.format === 'ao5' ? 5 : 3;
  // Categorías con soporte oficial de mezclas en csTimer
  const isSupportedCategory = currentCategoryObj
    ? currentCategoryObj.name in wcaEventMap
    : false;

  return (
    <div className="text-white p-4 md:p-6 lg:p-8">

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaSyncAlt className="text-blue-400" /> Mezclas Oficiales
          </h2>
          {!ready && (
            <p className="text-xs text-yellow-400 mt-1 animate-pulse">
              ⏳ Cargando motor de mezclas…
            </p>
          )}
        </div>

        {/* Selectores */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
              <MdCategory size={14} /> Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const newCat = categories.find((c) => c.id === e.target.value);
                if (newCat?.rounds.length) setSelectedRound(newCat.rounds[0].roundNumber);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1">
              <MdOutlineTimer size={14} /> Ronda
            </label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {currentCategoryObj?.rounds.map((round) => (
                <option key={round.roundNumber} value={round.roundNumber}>
                  {round.isFinal ? '🏆 Final' : `Ronda ${round.roundNumber}`} ({round.format.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
          <FaInfoCircle size={32} />
          <p>No hay categorías registradas en este torneo.</p>
          <p className="text-sm">Ve a la sección <strong>Categorías</strong> para añadirlas.</p>
        </div>
      ) : currentRoundObj ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">

          {/* Barra de la ronda */}
          <div className="p-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-900/40">
            <div>
              <h3 className="font-bold text-lg">
                {currentCategoryObj?.name} — {currentRoundObj.isFinal ? '🏆 Final' : `Ronda ${currentRoundObj.roundNumber}`}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {officialCount} mezclas oficiales + 2 extras · Motor csTimer (WCA-compatible)
              </p>
            </div>

            <div className="flex gap-2">
              {hasScrambles ? (
                <button
                  onClick={handleDeleteScrambles}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <FaTrash /> <span className="hidden sm:inline">Limpiar Todo</span>
                </button>
              ) : isSupportedCategory ? (
                <button
                  onClick={handleGenerateScrambles}
                  disabled={isGenerating || !ready}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${isGenerating || !ready
                      ? 'bg-gray-600 cursor-not-allowed opacity-70'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                  <FaSyncAlt className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? `Generando… ${progress}%` : 'Generar mezclas'}
                </button>
              ) : (
                <span className="text-xs text-yellow-400 flex items-center gap-1.5 bg-yellow-900/20 border border-yellow-700/40 px-3 py-1.5 rounded-lg">
                  <FaInfoCircle />
                  Categoría personalizada — sin mezclas disponibles
                </span>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          {isGenerating && (
            <div className="w-full bg-gray-700 h-1">
              <div
                className="bg-green-500 h-1 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Listado de scrambles */}
          <div className="p-4 md:p-6 bg-gray-900/30">
            {!isSupportedCategory ? (
              <div className="text-center py-12 text-yellow-500/70 flex flex-col items-center gap-3">
                <FaInfoCircle size={28} className="opacity-60" />
                <p className="font-medium">Categoría personalizada</p>
                <p className="text-sm text-gray-400 max-w-sm">
                  Esta categoría fue creada manualmente y no tiene un algoritmo de mezcla
                  oficial disponible en el motor csTimer. Solo los eventos WCA estándar
                  soportan generación automática de mezclas.
                </p>
              </div>
            ) : !hasScrambles ? (
              <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                <FaSyncAlt size={28} className="opacity-40" />
                <p>Presiona <strong>"Generar mezclas"</strong> para calcular las secuencias por grupos.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {(currentRoundObj.groups ?? []).map((group) => {
                  if (!group.scrambles || group.scrambles.length === 0) return null;

                  return (
                    <div key={group.id} className="relative">
                      {/* Header del grupo */}
                      <div className="sticky top-0 z-10 bg-gray-800 border border-gray-700 p-3 mb-4 rounded-lg flex items-center justify-between shadow-md">
                        <span className="font-primary font-bold text-lg text-blue-400">{group.name}</span>
                        <span className="text-xs px-3 py-1 bg-gray-900 text-gray-300 rounded block font-mono border border-gray-700">Horario: {group.startTime} - {group.endTime}</span>
                      </div>

                      <div className="space-y-4 pl-0 md:pl-4 border-l-0 md:border-l-2 border-gray-700/50">
                        {group.scrambles.map((scramble, i) => {
                          const isExtra = i >= officialCount;
                          const label = isExtra ? `E${i - officialCount + 1}` : `${i + 1}`;

                          return (
                            <div
                              key={i}
                              className={`flex flex-col xl:flex-row gap-4 items-center rounded-lg p-4 border break-inside-avoid shadow-sm ${isExtra
                                  ? 'border-yellow-700/40 bg-yellow-900/10'
                                  : 'border-gray-600 bg-gray-800'
                                }`}
                            >
                              {/* Etiqueta + texto */}
                              <div className="flex-1 w-full">
                                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${isExtra ? 'text-yellow-400' : 'text-blue-400'}`}>
                                  {isExtra ? `⚠ Extra ${label}` : `Mezcla ${label}`}
                                </div>
                                <div className="text-lg md:text-xl lg:text-2xl font-mono leading-relaxed break-words">
                                  {scramble.text}
                                </div>
                              </div>

                              {/* SVG del estado final */}
                              <div
                                className="flex-shrink-0 rounded-lg bg-gray-300 p-1.5 mix-blend-screen"
                                style={{ width: '180px' }}
                                dangerouslySetInnerHTML={{ __html: scramble.svg }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-700 pb-8">
        <div className="bg-gray-800/50 rounded-lg p-5 mb-6 text-sm text-gray-400">
          <h4 className="font-semibold text-gray-300 mb-2">💡 ¿Cómo funciona esta sección?</h4>
          <p>
            Aquí puedes generar las mezclas oficiales de cada ronda usando el algoritmo de{' '}
            <strong>csTimer</strong>, el mismo motor de generación utilizado por los cronómetros
            oficiales de competencias WCA. Las mezclas se guardan en el dispositivo y se
            conservan aunque recargues la página.
          </p>
        </div>
        <div className="text-center text-xs text-gray-500">
          © 2026 ruTournament - Sebastian Daza Pérez
        </div>
      </div>

      {/* Modal de Alerta de Grupos */}
      {showGroupAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-boxdark rounded-lg shadow-xl w-full max-w-md border border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
                <FaInfoCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Grupos no encontrados</h3>
              <p className="text-gray-400 text-center text-sm mb-6">
                Por favor, genera primero los grupos de esta ronda antes de calcular sus mezclas. Cada grupo requiere su propia secuencia oficial para evitar filtraciones de información.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowGroupAlert(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowGroupAlert(false);
                    navigate(`/dashboard/tournament/${id}/groups`);
                  }}
                  className="flex-1 py-2.5 px-4 bg-primary hover:bg-opacity-90 text-white rounded-lg transition-colors font-medium text-sm flex justify-center"
                >
                  Ir a Generador de Horarios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Scrambles;
