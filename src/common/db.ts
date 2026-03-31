import Dexie, { type Table } from 'dexie';

// 1. Definimos las interfaces basadas en localStorage.js
export interface ResultLocal {
    idCompetitor: string;
    times: number[];
    media: string;
}

export interface RoundLocal {
    id?: string;
    num: number;
    format: string;
    results: ResultLocal[];
    competitorsToAdvance: number;
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
