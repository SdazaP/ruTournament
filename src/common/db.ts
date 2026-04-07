import Dexie, { type Table } from 'dexie';

// 1. Definimos las interfaces basadas en localStorage.js
export type Penalty = '' | '+2' | 'DNF';

export interface TimeRecord {
    base: number;
    penalty: Penalty;
}

export interface ResultLocal {
    idCompetitor: string;
    times: (number | TimeRecord)[];
    media: string;
}

export interface ScrambleRecord {
    text: string;
    svg: string; // renderizado
}

export interface RoundLocal {
    id?: string;
    num: number;
    format: string;
    results: ResultLocal[];
    competitorsToAdvance: number;
    scrambles?: ScrambleRecord[];
}

export interface CategoryLocal {
    id?: string;
    name: string;
    format: string;
    rounds: RoundLocal[];
}

export interface CompetitorLocal {
    id?: string;
    name?: string;
    categories: string[]; // IDs de las categorías a las que pertenece
    roles?: string[]; // Roles disponibles: 'judge', 'runner', 'scrambler'
    assignedRoles?: Record<string, string[]>; // { 'ID_CATEGORIA': ['judge'] }
}

export interface TournamentLocal {
    id?: string;
    name: string;
    description: string;
    location: string;
    status: string;
    date: string;
    categories: CategoryLocal[];
    competitors: CompetitorLocal[];
}

// 2. Configuración de la base de datos local
export class RuTournamentDexie extends Dexie {
    // tabla principal "tournaments" en Dexie
    tournaments!: Table<TournamentLocal, string>;

    constructor() {
        super('RuTournamentDB');

        // Indices búsquedas para Dexie.
        this.version(1).stores({
            tournaments: 'id, name, status, date', // Índices de búsqueda
        });
    }
}

export const db = new RuTournamentDexie();
