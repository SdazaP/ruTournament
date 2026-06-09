import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaClock,
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaSave,
  FaUndo,
} from 'react-icons/fa';
import { db } from '../../common/db';
import { useTournamentStatus } from '../../hooks/useTournamentStatus';

type CategoryData = {
  id: string;
  name: string;
  icon: string;
  startTime: string;
  endTime: string;
  room: string;
  format: string;
  participants: number;
};

const timeToMinutes = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const minutesToTime = (mins: number): string => {
  const clamped = Math.max(0, mins);
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const diffMinutes = (start: string, end: string): number => {
  return timeToMinutes(end) - timeToMinutes(start);
};

const formatDuration = (start: string, end: string): string => {
  const d = diffMinutes(start, end);
  if (d <= 0) return '0m';
  const h = Math.floor(d / 60);
  const m = d % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const snapTo5 = (mins: number): number => Math.round(mins / 5) * 5;

const Schedule = () => {
  const { id: tournamentId } = useParams();
  const { isFinalized } = useTournamentStatus(tournamentId);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('__all__');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [originalCategories, setOriginalCategories] = useState<CategoryData[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [conflicts, setConflicts] = useState<{ a: string; b: string; room: string }[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    catId: string;
    type: 'move' | 'resize-top' | 'resize-bottom';
    origStart: string;
    origEnd: string;
    startY: number;
    totalMinutes: number;
    earliestStart: string;
    moved: boolean;
    currentStart?: string;
    currentEnd?: string;
  } | null>(null);

  useEffect(() => {
    if (tournamentId) {
      db.tournaments.get(tournamentId).then((t) => {
        if (t) {
          const cats: CategoryData[] = (t.categories || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: c.name.substring(0, 3),
            startTime: c.startTime || '10:00',
            endTime: c.endTime || '11:00',
            room: c.room || '',
            format: c.format === 'wca' ? 'WCA' : 'RedBull',
            participants: (t.competitors || []).filter((co: any) =>
              co.categories.includes(c.id),
            ).length,
          }));
          setCategories(cats);
          const uniqueRooms = [...new Set(cats.map((c) => c.room).filter(Boolean))] as string[];
          setRooms(uniqueRooms);
        }
      });
    }
  }, [tournamentId]);

  useEffect(() => {
    const filtered = selectedRoom === '__all__'
      ? categories
      : categories.filter((c) => c.room === selectedRoom);

    const conflictsFound: { a: string; b: string; room: string }[] = [];
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        const a = filtered[i];
        const b = filtered[j];
        if (a.room !== b.room || !a.room) continue;
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        if (aStart < bEnd && bStart < aEnd) {
          conflictsFound.push({ a: a.id, b: b.id, room: a.room });
        }
      }
    }
    setConflicts(conflictsFound);
  }, [categories, selectedRoom]);

  const saveTime = useCallback(
    async (catId: string, startTime: string, endTime: string) => {
      if (!tournamentId) return;
      const t = await db.tournaments.get(tournamentId);
      if (t) {
        t.categories = t.categories.map((c: any) =>
          c.id === catId ? { ...c, startTime, endTime } : c,
        ) as any;
        await db.tournaments.put(t as any);
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId ? { ...c, startTime, endTime } : c,
        ),
      );
    },
    [tournamentId],
  );

  const saveRoom = useCallback(
    async (catId: string, room: string) => {
      if (!tournamentId) return;
      const t = await db.tournaments.get(tournamentId);
      if (t) {
        t.categories = t.categories.map((c: any) =>
          c.id === catId ? { ...c, room } : c,
        ) as any;
        await db.tournaments.put(t as any);
      }
      setCategories((prev) => {
        const updated = prev.map((c) =>
          c.id === catId ? { ...c, room } : c,
        );
        const uniqueRooms = [...new Set(updated.map((c) => c.room).filter(Boolean))] as string[];
        setRooms(uniqueRooms);
        return updated;
      });
    },
    [tournamentId],
  );

  const localUpdateTime = useCallback(
    (catId: string, startTime: string, endTime: string) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId ? { ...c, startTime, endTime } : c,
        ),
      );
    },
    [],
  );

  const localUpdateRoom = useCallback(
    (catId: string, room: string) => {
      setCategories((prev) => {
        const updated = prev.map((c) =>
          c.id === catId ? { ...c, room } : c,
        );
        return updated;
      });
    },
    [],
  );

  const changedCount = !editMode
    ? 0
    : categories.filter((cat) => {
        const orig = originalCategories.find((o) => o.id === cat.id);
        if (!orig) return true;
        return cat.startTime !== orig.startTime || cat.endTime !== orig.endTime || cat.room !== orig.room;
      }).length;

  const handleToggleEditMode = () => {
    if (editMode) {
      if (changedCount > 0) {
        setShowConfirmModal(true);
      } else {
        setEditMode(false);
        setOriginalCategories([]);
      }
    } else {
      setOriginalCategories(JSON.parse(JSON.stringify(categories)));
      setEditMode(true);
      setEditingCatId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!tournamentId) return;
    const t = await db.tournaments.get(tournamentId);
    if (t) {
      t.categories = t.categories.map((c: any) => {
        const updated = categories.find((lc) => lc.id === c.id);
        if (updated) {
          return { ...c, startTime: updated.startTime, endTime: updated.endTime, room: updated.room || '' };
        }
        return c;
      }) as any;
      await db.tournaments.put(t as any);
    }
    setEditMode(false);
    setShowConfirmModal(false);
    setOriginalCategories([]);
    const uniqueRooms = [...new Set(categories.map((c) => c.room).filter(Boolean))] as string[];
    setRooms(uniqueRooms);
  };

  const handleDiscardAll = () => {
    setCategories(JSON.parse(JSON.stringify(originalCategories)));
    const uniqueRooms = [...new Set(originalCategories.map((c) => c.room).filter(Boolean))] as string[];
    setRooms(uniqueRooms);
    setEditMode(false);
    setShowConfirmModal(false);
    setOriginalCategories([]);
    setEditingCatId(null);
  };

  const handleAddRoom = () => {
    const name = newRoomName.trim();
    if (!name || rooms.includes(name)) return;
    setRooms([...rooms, name]);
    setNewRoomName('');
    setShowAddRoom(false);
  };

  const handleDeleteRoom = async (room: string) => {
    if (editMode) {
      setCategories((prev) => prev.map((c) => (c.room === room ? { ...c, room: '' } : c)));
      setRooms((prev) => prev.filter((r) => r !== room));
      if (selectedRoom === room) setSelectedRoom('__all__');
      return;
    }
    if (!tournamentId) return;
    const t = await db.tournaments.get(tournamentId);
    if (t) {
      t.categories = t.categories.map((c: any) =>
        c.room === room ? { ...c, room: '' } : c,
      ) as any;
      await db.tournaments.put(t as any);
    }
    setCategories((prev) => prev.map((c) => (c.room === room ? { ...c, room: '' } : c)));
    setRooms((prev) => prev.filter((r) => r !== room));
    if (selectedRoom === room) setSelectedRoom('__all__');
  };

  const filtered = selectedRoom === '__all__'
    ? categories
    : categories.filter((c) => c.room === selectedRoom);

  const sorted = [...filtered].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  const times = sorted.map((c) => timeToMinutes(c.startTime)).concat(
    sorted.map((c) => timeToMinutes(c.endTime)),
  );
  const earliestMinutes = sorted.length > 0
    ? Math.min(...times) - 30
    : timeToMinutes('08:00');
  const latestMinutes = sorted.length > 0
    ? Math.max(...times) + 30
    : timeToMinutes('18:00');
  const totalMinutes = Math.max(latestMinutes - earliestMinutes, 60);

  const getBarStyle = (cat: CategoryData) => {
    const start = timeToMinutes(cat.startTime);
    const end = timeToMinutes(cat.endTime);
    const top = ((start - earliestMinutes) / totalMinutes) * 100;
    const height = Math.max(((end - start) / totalMinutes) * 100, 2);
    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  const generateTimeLabels = () => {
    const labels: number[] = [];
    const startHour = Math.floor(earliestMinutes / 60);
    const endHour = Math.ceil(latestMinutes / 60);
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const mins = h * 60 + m;
        if (mins >= earliestMinutes && mins <= latestMinutes) {
          labels.push(mins);
        }
      }
    }
    return labels;
  };

  const timeLabels = generateTimeLabels();

  const getConflictBadge = (catId: string) => {
    return conflicts.some((c) => c.a === catId || c.b === catId);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    catId: string,
    type: 'move' | 'resize-top' | 'resize-bottom',
  ) => {
    if (isFinalized || !editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    dragState.current = {
      catId,
      type,
      origStart: cat.startTime,
      origEnd: cat.endTime,
      startY: e.clientY,
      totalMinutes,
      earliestStart: minutesToTime(earliestMinutes),
      moved: false,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    setEditingCatId(null);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const ds = dragState.current;
    if (!ds || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaY = e.clientY - ds.startY;
    if (Math.abs(deltaY) > 3) ds.moved = true;
    const deltaMinutes = snapTo5((deltaY / rect.height) * ds.totalMinutes);
    let newStart = timeToMinutes(ds.origStart);
    let newEnd = timeToMinutes(ds.origEnd);
    const duration = newEnd - newStart;

    if (ds.type === 'move') {
      newStart = snapTo5(timeToMinutes(ds.origStart) + deltaMinutes);
      newEnd = newStart + duration;
    } else if (ds.type === 'resize-top') {
      newStart = snapTo5(timeToMinutes(ds.origStart) + deltaMinutes);
      if (newStart >= newEnd - 5) newStart = newEnd - 5;
      if (newStart < 0) newStart = 0;
    } else if (ds.type === 'resize-bottom') {
      newEnd = snapTo5(timeToMinutes(ds.origEnd) + deltaMinutes);
      if (newEnd <= newStart + 5) newEnd = newStart + 5;
    }

    const startStr = minutesToTime(newStart);
    const endStr = minutesToTime(newEnd);
    ds.currentStart = startStr;
    ds.currentEnd = endStr;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === ds.catId
          ? { ...c, startTime: startStr, endTime: endStr }
          : c,
      ),
    );
  };

  const handleMouseUp = () => {
    const ds = dragState.current;
    if (ds) {
      if (ds.currentStart && ds.currentEnd) {
        localUpdateTime(ds.catId, ds.currentStart, ds.currentEnd);
      }
      if (!ds.moved) {
        setEditingCatId((prev) => (prev === ds.catId ? null : ds.catId));
      }
    }
    dragState.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleEmptyAreaClick = () => {
    setEditingCatId(null);
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard/tournament/${tournamentId}/categories`}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft />
          </Link>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaClock className="text-blue-400" /> Cronograma
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="__all__">Todas las salas</option>
            <option value="">Sin sala</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {!isFinalized && (
            <button
              onClick={handleToggleEditMode}
                className={`px-4 py-2 w-full sm:w-auto rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                editMode
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editMode ? <FaTimes /> : <FaEdit />}
              {editMode ? 'Desactivar Edición' : 'Activar Edición'}
            </button>
          )}
          {!isFinalized && editMode && (
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 w-full sm:w-auto text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors border border-gray-600"
            >
              <FaPlus size={10} /> Nueva Sala
            </button>
          )}
        </div>
      </div>

      {showAddRoom && !isFinalized && editMode && (
        <div className="mb-4 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3">
          <input
            type="text"
            placeholder="Nombre de la sala..."
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddRoom();
              if (e.key === 'Escape') setShowAddRoom(false);
            }}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddRoom}
            disabled={!newRoomName.trim() || rooms.includes(newRoomName.trim())}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck />
          </button>
          <button
            onClick={() => {
              setShowAddRoom(false);
              setNewRoomName('');
            }}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {rooms.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {rooms.map((r) => (
            <span
              key={r}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 border border-gray-600 rounded-full text-xs text-gray-300"
            >
              {r}
              {!isFinalized && editMode && (
                <button
                  onClick={() => handleDeleteRoom(r)}
                  className="text-gray-500 hover:text-red-400"
                  title="Eliminar sala"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {isFinalized && (
        <div className="mb-6 bg-gray-700/40 border border-gray-600 rounded-lg px-4 py-3 flex items-center gap-3 text-gray-300 text-sm">
          <FaClock className="text-gray-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Torneo Finalizado.</strong> El cronograma es solo lectura.
          </span>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
          <FaClock size={32} className="opacity-50" />
          <p>No hay categorías registradas.</p>
          <Link
            to={`/dashboard/tournament/${tournamentId}/categories`}
            className="text-blue-400 hover:underline text-sm"
          >
            Ir a administrar categorías
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[80px_1fr] gap-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mb-6">
            <div className="hidden lg:block border-r border-gray-700 bg-gray-850 relative" style={{ minHeight: `${Math.max(totalMinutes * 1.0, 300)}px` }}>
              {timeLabels.map((mins) => (
                <div
                  key={mins}
                  className="absolute left-0 right-0 px-2 text-xs text-gray-500"
                  style={{ top: `${((mins - earliestMinutes) / totalMinutes) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {minutesToTime(mins)}
                </div>
              ))}
            </div>

            <div
              ref={timelineRef}
              className="relative bg-gray-800/50"
              style={{ minHeight: `${Math.max(totalMinutes * 1.0, 300)}px` }}
              onClick={handleEmptyAreaClick}
            >
              {timeLabels.map((mins) => (
                <div
                  key={mins}
                  className="absolute left-0 right-0 border-t border-gray-700/50 pointer-events-none"
                  style={{ top: `${((mins - earliestMinutes) / totalMinutes) * 100}%` }}
                />
              ))}

              {sorted.map((cat) => {
                const conflicting = getConflictBadge(cat.id);
                const style = getBarStyle(cat);
                const isWCA = cat.format === 'WCA';
                return (
                  <div
                    key={cat.id}
                    className={`absolute left-2 right-2 rounded-lg border transition-colors group ${
                      isWCA
                        ? 'bg-blue-600/30 border-blue-500/50 hover:bg-blue-600/50'
                        : 'bg-red-600/30 border-red-500/50 hover:bg-red-600/50'
                    } ${conflicting ? 'ring-2 ring-yellow-500/70' : ''} ${
                      editingCatId === cat.id ? 'ring-2 ring-white/70' : ''
                    } ${editMode && !isFinalized ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    style={{ top: style.top, height: style.height, minHeight: '28px' }}
                    onMouseDown={(e) => editMode ? handleMouseDown(e, cat.id, 'move') : undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isFinalized && editMode && (
                      <>
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-white/20 rounded-t-lg z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, cat.id, 'resize-top');
                          }}
                        />
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-white/20 rounded-b-lg z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, cat.id, 'resize-bottom');
                          }}
                        />
                      </>
                    )}
                    <div className="px-2 py-1 h-full flex flex-col justify-center overflow-hidden">
                      <span className="text-xs font-bold truncate">
                        {cat.icon} {cat.name}
                      </span>
                      <span className="text-[10px] text-gray-300 font-mono">
                        {cat.startTime} - {cat.endTime}
                      </span>
                      {cat.room && (
                        <span className="text-[10px] text-gray-400 truncate">
                          {cat.room}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {editingCatId && editMode && !isFinalized && (
                (() => {
                  const cat = categories.find((c) => c.id === editingCatId);
                  if (!cat) return null;
                  const style = getBarStyle(cat);
                  return (
                    <div
                      className="absolute left-1/2 z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl w-64 transform -translate-x-1/2"
                      style={{ top: `calc(${style.top} + ${parseFloat(style.height) / 2}%)`, transform: 'translate(-50%, -50%)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-sm font-medium text-gray-200 mb-3 truncate pr-5">{cat.name}</div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <input
                          type="time"
                          value={cat.startTime}
                          onChange={(e) => localUpdateTime(cat.id, e.target.value, cat.endTime)}
                          className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-gray-500 text-xs flex-shrink-0">a</span>
                        <input
                          type="time"
                          value={cat.endTime}
                          onChange={(e) => localUpdateTime(cat.id, cat.startTime, e.target.value)}
                          className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <select
                        value={cat.room || ''}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setShowAddRoom(true);
                            setEditingCatId(null);
                          } else {
                            localUpdateRoom(cat.id, e.target.value);
                          }
                        }}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sin sala</option>
                        {rooms.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                        <option value="__new__">+ Nueva sala...</option>
                      </select>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-3 flex items-start gap-3 text-yellow-300 text-sm">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-yellow-200">Conflictos de horario detectados:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {conflicts.map((c, i) => {
                    const a = categories.find((x) => x.id === c.a);
                    const b = categories.find((x) => x.id === c.b);
                    return (
                      <li key={i}>
                        <strong>{a?.name || '?'}</strong> y <strong>{b?.name || '?'}</strong> en Sala "{c.room}"
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <FaEdit size={14} /> Categorías ({filtered.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Nombre</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Formato</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Sala</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Inicio</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Fin</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400">Dur.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sorted.map((cat) => (
                    <tr
                      key={cat.id}
                      className={`hover:bg-gray-750 transition-colors ${
                        getConflictBadge(cat.id) ? 'bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="p-3 font-medium">{cat.name}</td>
                      <td className="p-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            cat.format === 'WCA'
                              ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                              : 'bg-red-900/50 text-red-300 border border-red-700/50'
                          }`}
                        >
                          {cat.format}
                        </span>
                      </td>
                      <td className="p-3">
                        {!isFinalized && editMode ? (
                          <select
                            value={cat.room || ''}
                            onChange={(e) => localUpdateRoom(cat.id, e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Sin sala</option>
                            {rooms.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">{cat.room || '—'}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {!isFinalized && editMode ? (
                          <input
                            type="time"
                            value={cat.startTime}
                            onChange={(e) => localUpdateTime(cat.id, e.target.value, cat.endTime)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          cat.startTime
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {!isFinalized && editMode ? (
                          <input
                            type="time"
                            value={cat.endTime}
                            onChange={(e) => localUpdateTime(cat.id, cat.startTime, e.target.value)}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          cat.endTime
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {formatDuration(cat.startTime, cat.endTime)}
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        {selectedRoom === '__all__'
                          ? 'No hay categorías registradas'
                          : 'No hay categorías en esta sala'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-boxdark rounded-lg shadow-xl w-full max-w-md border border-gray-600 overflow-hidden transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 mb-4 mx-auto">
                <FaSave size={22} />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Guardar Cambios</h3>
              <p className="text-gray-400 text-center text-sm mb-6">
                Se modificaron <strong className="text-white">{changedCount}</strong> {changedCount === 1 ? 'categoría' : 'categorías'}. ¿Qué deseas hacer con los cambios?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSaveAll}
                  className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <FaCheck /> Guardar Cambios
                </button>
                <button
                  onClick={handleDiscardAll}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <FaUndo /> Descartar Cambios
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-2.5 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editMode && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce z-50">
          <FaEdit /> Modo edición activado
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-gray-700 pb-8">
        <div className="bg-gray-800/50 rounded-lg p-5 mb-6 text-sm text-gray-400">
          <h4 className="font-semibold text-gray-300 mb-2">Como usar el cronograma</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Arrastra</strong> las barras para cambiar el horario de una categoria.
            </li>
            <li>
              Usa los <strong>bordes superior/inferior</strong> de cada barra para ajustar la duracion.
            </li>
            <li>
              Haz <strong>clic</strong> en una barra para editar horario y sala rapidamente.
            </li>
            <li>
              Agrupa por <strong>sala</strong> para detectar conflictos en un mismo espacio fisico.
            </li>
          </ul>
        </div>
        <div className="text-center text-xs text-gray-500">
          2026 ruTournament - Sebastian Daza Perez
        </div>
      </div>
    </div>
  );
};

export default Schedule;
