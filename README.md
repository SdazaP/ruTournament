# ruTournament - Rubik's Cube Tournament Management

## Descripción General
**ruTournament** es la plataforma web definitiva desarrollada en React y Tailwind CSS para la gestión integral de competencias locales de cubos de Rubik y otras variaciones. Diseñada para cubrir las necesidades reales de organizadores y delegados, la aplicación estructura de forma eficaz todo el ciclo de vida de un certamen: creación del torneo, selección de grupos, registro de competidores y el ingreso instantáneo de resultados.

## Características Principales

- 📱 **Arquitectura Offline-First**: Todo se guarda asíncronamente en el caché profundo de tu navegador utilizando IndexedDB (gracias a **Dexie.js**). Online próximamente...

- ⏱ **Cálculo Automático de Tiempos Oficiales**:
  - **Formato WCA**: Calcula con exactitud aritmética promedios `ao5` (Descartando el peor y mejor tiempo) y medias `ao3`. 
  - **Formato Red Bull**: Configurado para enfrentar competidores uno a uno a través de tablas de batallas (Red Bull Rubik's Cube World Cup mode). Próximamente...

- 🎨 **Interfaz Premium UX/UI**: Construimos este portal para que sea asombroso. Con un Modo Oscuro por defecto, la visibilidad es perfecta en entornos saturados de luz. Integra visualizaciones modernas, bordes translúcidos en tablas y steppers de avance intuitivos para el organizador.

- 👥 **Manejo Centralizado de Competidores**: Soporte para que un mismo participante compita en múltiples categorías (Ej: 3x3, 4x4 y One-Handed) usando un esquema modular para añadir o quitar etiquetas asíncronamente sin recargar la página.

## Tecnologías Utilizadas
- **Framework & Empaquetador**: React 18 + Vite
- **Lenguaje**: TypeScript
- **Base de Datos & Almacenamiento**: IndexedDB vía Dexie.js
- **Estilos**: Vanilla CSS combinado exhaustivamente con Tailwind CSS. Modificado a mano para un look "Dark-Glassmorphism" con sombras de colores.
- **Enrutamiento**: React Router v6
- **Iconografía**: react-icons 

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
4. Navega en tu navegador moderno (Google Chrome o Edge) hacia la dirección predeterminada:
    ```text
    http://localhost:5173
    ```
    *¡Disfruta organizando torneos y midiendo tus records localmente!*

---
> Diseñado en Pro de la comunidad Speedcubing
