# ruTournament

Sistema de gestión de torneos de Rubik's Cube offline-first. SPA construida con React, TypeScript y Tailwind CSS. Permite crear torneos, registrar competidores, configurar categorías WCA y Red Bull, generar grupos y scrambles, ingresar resultados y visualizarlos públicamente.

## Características

- **Offline-first** — toda la data persiste en IndexedDB vía Dexie.js. Sin backend.
- **Formato WCA** — cálculo automático de promedios ao5 y ao3, avance entre rondas, penalizaciones +2/DNF.
- **Formato Red Bull** — brackets de eliminación directa, ronda previa de colocación opcional, avance automatico de ganadores.
- **Staffing** — asignación de roles Judge, Runner y Scrambler por competidor y categoría.
- **Grupos y Scrambles** — generación automática de grupos y mezclas vía csTimer.
- **Tres estados** — próximamente / activo / finalizado, con bloqueo de solo lectura al finalizar.
- **Modo oscuro/claro** — detecta preferencia del sistema, toggle manual persistente.
- **Logo personalizable** — subida de imagen con resize automático a 200px + 3 logos SVG por defecto (3x3, 2x2, 4x4).
- **Responsive** — vista de resultados adaptada a escritorio y móvil.

## Stack

| Categoría | Tecnología |
|-----------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 4 |
| Estilos | Tailwind CSS 3  |
| Enrutamiento | React Router v6 |
| Almacenamiento | Dexie.js sobre IndexedDB |
| Iconografía | react-icons |
| Formateo | Prettier + prettier-plugin-tailwindcss |

## Estructura del proyecto

```
src/
├── common/
│   ├── db.ts              # Esquema Dexie (TournamentLocal, CompetitorLocal, etc.)
│   └── Loader/            # Spinner de carga inicial
├── pages/
│   ├── Dashboard/         # WelcomePage, Tournaments, Guide
│   ├── NewTournament/     # Wizard de creación (3 pasos)
│   └── Tournament/        # Competidores, Staffing, Grupos, Categorías,
│                          # Scrambles, Results, ResultsView, Schedule
├── components/
│   ├── Header/            # Barra superior + DarkModeSwitcher
│   └── Sidebar/           # Sidebar del dashboard y sidebar por torneo
├── hooks/                 # useColorMode, useLocalStorage
└── layout/                # DashboardLayout, DashboardTournament
```

## Instalación y Configuración Local
Corre tu propio gestor de ruTournament desde tu computadora en un par de pasos usando Node.js.

### Requisitos Previos
- Instalar **Node.js** (Versión 16.0+ recomendada)
- `npm` o `yarn` instalado

### Instrucciones

1. **Abre tu terminal** y navega al directorio del proyecto.
2. **Instala las dependencias principales**:
    ```bash
    npm install
    ```
3. **Inicializa el entorno Vite de desarrollo**:
    ```bash
    npm run dev
    ```
4. Navega en tu navegador (Google Chrome o Edge) hacia la dirección predeterminada:
    ```text
    http://localhost:5173
    ```
    *¡Disfruta organizando torneos!*


## Guía de uso

La aplicación incluye una guía paso a paso en **/dashboard/guide** que cubre el flujo completo: creación del torneo, navegación, competidores, staffing, categorías, cronograma, grupos, scrambles, resultados WCA y Red Bull, visualización pública y finalización.

---
> Diseñado en Pro de la comunidad Speedcubing - SdazaP
