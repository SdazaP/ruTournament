import { useEffect, useState } from 'react';
import { db } from '../common/db';

export type TournamentStatus = 'activo' | 'proximamente' | 'finalizado';

/**
 * Hook que devuelve los permisos del torneo según su estado:
 *  - activo       → canEdit=true,  canUploadResults=true
 *  - proximamente → canEdit=true,  canUploadResults=false
 *  - finalizado   → canEdit=false, canUploadResults=false
 */
export const useTournamentStatus = (id: string | undefined) => {
  const [status, setStatus] = useState<TournamentStatus>('activo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    db.tournaments.get(id).then((t) => {
      if (t?.status) setStatus(t.status as TournamentStatus);
      setLoading(false);
    });
  }, [id]);

  const canEdit = status === 'activo' || status === 'proximamente';
  const canUploadResults = status === 'activo';
  const isFinalized = status === 'finalizado';

  return { status, canEdit, canUploadResults, isFinalized, loading };
};
