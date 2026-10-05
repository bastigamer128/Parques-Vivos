# 🌳 Parques Vivos — Parque Almagro

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Google Calendar](https://img.shields.io/badge/Google_Calendar-Integrated-4285F4?logo=googlecalendar&logoColor=white)](https://calendar.google.com/)

> **"Un parque habitado por sus vecinos es un parque seguro y alegre para todos."**

**Parques Vivos** es una plataforma web progresiva (PWA / Mobile-First) diseñada para fomentar la presencia comunitaria, la organización vecinal y la seguridad preventiva en el **Parque Almagro** (Santiago Centro, Chile). Mediante actividades diurnas y vespertinas —deportivas, culturales, familiares y de cuidado mutuo—, los vecinos coordinan encuentros presenciales protegidos por la concurrencia colectiva.

---

## 📸 Vista General y Propósito

En los parques urbanos, la delincuencia y el aislamiento retroceden cuando el espacio público es ocupado de forma activa y predecible por la propia comunidad. **Parques Vivos** soluciona la falta de coordinación vecinal ofreciendo:

1. **Mapa Interactivo con Geocerca Estricta:** Delimita el perímetro real del Parque Almagro y previene la creación de eventos en sectores no autorizados o fuera del área verde.
2. **Publicación y Asistencia a Actividades:** Encuentros grupales de yoga, calistenia, paseos caninos, ferias de trueque, ajedrez y rondas vecinales nocturnas de regreso seguro desde el Metro.
3. **Sincronización con Google Calendar:** Agrega automáticamente cualquier actividad comunitaria a tu calendario personal o exporta en formato universal `.ics`.
4. **Modo Accesibilidad para Adultos Mayores:** Aumento tipográfico proporcional con contraste adaptado para personas de la tercera edad (`A+` / `A`).
5. **Foro Comunitario y Red Vecinal:** Espacio para proponer mejoras al parque (iluminación, bebederos, caniles) y conectar con los comités barriales.

---

## 🗺️ Delimitación Geográfica del Parque Almagro

El sistema utiliza coordenadas geodésicas de alta precisión calibradas sobre **OpenStreetMap**:

- **Norte:** Calle Santa Isabel (`lat: -33.45140`)
- **Sur:** Calle Mensía de los Nidos (`lat: -33.45275`)
- **Oriente:** Calle San Diego / Plazoleta Basílica Sacramentinos / Acceso Metro Línea 3 (`lng: -70.65040`)
- **Poniente:** Calle Dieciocho / Campus Universidad Central (`lng: -70.65730`)
- **Centro Neurálgico:** Explanada Monumento Central a Diego de Almagro (`[-33.45210, -70.65380]`)

### Sectores Identificados en el Parque:
- 🏛️ **Explanada Monumento Central:** Yoga, meditación, asambleas.
- 🐕 **Canil Cerrado:** Adiestramiento positivo y socialización de mascotas (Lord Cochrane a San Ignacio).
- 💪 **Estación de Calistenia:** Barras y acondicionamiento físico matutino (sector Nataniel Cox).
- 📚 **Plazoleta San Diego:** Feria de libros usados y trueque frente a la Basílica de los Sacramentinos.
- 🎭 **Pérgola Central y Juegos de Madera:** Cuentacuentos infantiles y teatro vecinal.
- ♟️ **Pradera Verde Poniente:** Ajedrez, mateadas y picnics comunitarios con estudiantes universitarios.
- 🛡️ **Acceso Metro Parque Almagro:** Punto de partida para las rondas vecinales de retorno seguro.

---

## 🚀 Características Principales

### 1. Mapa Comunitario Georreferenciado (`MapView.tsx`)
- **Motor de Renderizado:** Leaflet 1.9 con tiles vectoriales optimizados de OpenStreetMap.
- **Geocercado con Algoritmo Ray-Casting:** Valida matemáticamente si un punto está dentro del polígono del parque antes de permitir crear una actividad.
- **Calibración Manual de Límites:** Los administradores o coordinadores pueden ajustar los 12 vértices del polígono arrastrando marcadores numerados a 60 FPS sin recargas pesadas.
- **Carrusel Inferior de Recomendaciones:** Muestra las próximas actividades con opción de **Minimizar / Expandir** para no obstruir la visibilidad del mapa.
- **Botón Flotante (`+ Actividad`) Libre de Interrupciones:** Ubicado estratégicamente por encima de la barra de navegación y con separación vertical limpia sobre las tarjetas de recomendación.
- **Filtros por Categoría:** Chips temáticos con conteo en vivo (Deporte, Mascotas, Cultura, Seguridad, Infantil, Social).
- **Geolocalización GPS en Vivo:** Identifica si el vecino se encuentra físicamente dentro del parque.

### 2. Creación Guiada de Actividades en 2 Pasos (`CreateActivityModal.tsx`)
1. **Paso 1 (Mapa):** El usuario toca el punto exacto del parque donde se reunirán; el sistema detecta automáticamente el nombre del sector más cercano.
2. **Paso 2 (Formulario):** Define título, horario, categoría, cupos, descripción y un **consejo de seguridad barrial** (ej. "Llevar linterna", "Punto con farolas solares").

### 3. Sincronización con Google Calendar (`calendarService.ts`)
- **Sincronización Directa OAuth:** Añade eventos al calendario principal del usuario con ubicación geográfica, alertas preventivas y enlace a la comunidad.
- **Exportación Estándar `.ics`:** Permite importar eventos en Apple Calendar, Outlook o cualquier cliente compatible.
- **Vista de Calendario Integrada (`CalendarView.tsx`):** Navegación mensual y semanal con indicadores de asistencia.

### 4. Accesibilidad Universal (Modo Adulto Mayor)
- Diseñado pensando en los vecinos mayores históricos del barrio.
- Botón en cabecera conmutable (`A+` / `A`) que incrementa la tipografía de títulos, párrafos y etiquetas sin romper la grilla móvil ni colapsar otros controles.

### 5. Foro Vecinal y Diálogo Barrial (`ForumView.tsx`)
- Propuestas para la municipalidad y juntas de vecinos (puntos limpios, iluminación LED, bebederos).
- Votaciones comunitarias con likes e hilos de comentarios vecinales.

### 6. Directorio Comunitario y Gamificación (`CommunityView.tsx`, `ProfileView.tsx`)
- Puntos de reputación vecinal por organizar actividades y asistir a encuentros.
- Enlace para invitar nuevos vecinos vía WhatsApp o redes sociales.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Componentes funcionales tipados con hooks modernos. |
| **Estilos & Diseño** | Tailwind CSS v4 | Estilos basados en utilidades, soporte de accesibilidad y modo responsive móvil prioritario. |
| **Mapas & Geometría** | Leaflet 1.9 + Ray-Casting | Algoritmos de punto en polígono (Point-in-Polygon) y tiles de OpenStreetMap. |
| **Empaquetador / Bundler** | Vite 8 | Servidor de desarrollo ultra rápido y compilación modular optimizada. |
| **Integración Cloud** | Google Workspace Calendar API | Sincronización de eventos de calendario vía OAuth y estándar iCalendar RFC 5545. |
| **Iconografía** | Lucide React | Iconos SVG optimizados y accesibles. |
| **Persistencia Local** | LocalStorage con versionado | Caché resiliente de actividades, publicaciones y configuración del usuario con migración automática. |

---

## 📁 Estructura del Proyecto

```text
├── index.html                   # Entry point HTML con metadatos SEO y tipografía Plus Jakarta Sans
├── package.json                 # Dependencias y scripts de construcción
├── vite.config.ts               # Configuración de Vite con plugins de React y Tailwind
├── tsconfig.json                # Configuración de compilación TypeScript
├── metadata.json                # Identidad y permisos del applet
└── src/
    ├── main.tsx                 # Bootstrap de la aplicación React
    ├── App.tsx                  # Componente raíz, orquestación de pestañas y modales
    ├── index.css                # Estilos globales de Tailwind CSS y reglas de accesibilidad
    ├── types.ts                 # Definiciones de tipos e interfaces de TypeScript
    ├── data/
        └── mockData.ts          # Coordenadas maestras, polígono del parque y actividades iniciales
    ├── services/
        └── calendarService.ts   # Integración con Google Calendar y generación de archivos .ics
    └── components/
        ├── Header.tsx           # Barra superior con marca, botón Google Calendar, modo A+ y tutorial
        ├── BottomNav.tsx        # Navegación inferior fija (Mapa, Calendario, Foro, Comunidad, Perfil)
        ├── MapView.tsx          # Mapa Leaflet, geocerca perimetral, calibrador, carrusel y botón FAB
        ├── ActivityDetailModal.tsx # Detalle ampliado de la actividad con botón de asistencia y consejos
        ├── CreateActivityModal.tsx # Asistente de publicación de actividades en 2 pasos
        ├── CalendarView.tsx     # Vista mensual y semanal de eventos del parque
        ├── ForumView.tsx        # Muro de discusión, propuestas y comentarios comunitarios
        ├── CommunityView.tsx    # Directorio de vecinos y comités barriales
        ├── ProfileView.tsx      # Perfil del vecino, medallas y reputación barrial
        ├── EditProfileModal.tsx # Edición de datos del perfil
        ├── InviteNeighborModal.tsx # Invitaciones vía WhatsApp y enlace directo
        └── OnboardingModal.tsx  # Tutorial interactivo de bienvenida paso a paso
```

---

## ⚙️ Instalación y Puesta en Marcha Local

### Prerrequisitos:
- **Node.js:** Versión 18 o superior.
- **npm** o **bun** instalado en tu sistema.

### Pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/parques-vivos-almagro.git
   cd parques-vivos-almagro
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000` (o el puerto asignado en la consola).

4. **Validación de tipos y linting:**
   ```bash
   npm run lint
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   ```
   Los artefactos optimizados se generarán en la carpeta `dist/`.

---

## 🛡️ Seguridad y Buenas Prácticas Comunitarias

- **Validación de Área Verde:** No es posible colocar marcadores fuera de los senderos o plazas del parque.
- **Regla de Ocupación Grupal:** Se promueve un mínimo de 3 a 5 vecinos por actividad para generar sensación de resguardo mutuo.
- **Respeto Ambiental:** Toda actividad en el parque incluye la recomendación comunitaria de retirar residuos y cuidar la vegetación y las instalaciones del canil.

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia **MIT**. Puedes usarlo, adaptarlo y replicarlo para cualquier parque o plaza de tu ciudad.

---

*Desarrollado con ❤️ para la comunidad del barrio San Diego, Lord Cochrane, Nataniel Cox y Parque Almagro.*
