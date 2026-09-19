# MesaMusic-web

Frontend en Next.js del sistema de música colaborativa vía QR. Se conecta al
backend Go (`mesamusic-api`) por REST + WebSocket para búsqueda,
cola compartida en tiempo real y reproducción vía YouTube IFrame Player.

> Estado del proyecto: preparando una **beta privada** (ver `docs/Roadmap-v4.md`
> en la raíz del repo). Ya están cerradas las sesiones con QR (v0.2.0) y el
> control mínimo de emergencia del host — eliminar/saltar canciones (subconjunto
> adelantado de v0.3.0).
>
> Ya hay una versión desplegada en **https://beta.mesamusic.co**.

## Conectar con el backend

1. Asegúrate de que `mesamusic-api` esté corriendo (por defecto en
`http://localhost:8080`, ver su propio README).
2. Crea (o edita) `.env.local` en la raíz de este proyecto:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Es la única variable que usa el frontend — `lib/api.ts` deriva de ahí tanto
las URLs REST como la del WebSocket (`ws://.../api/sessions/{id}/ws`).

## Instalar y correr

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. La app ya no es una sola pantalla con switcher:
cada rol tiene su propia ruta, para que recargar la página no pierda el
estado de la sesión.

* **`/`** — pantalla de inicio: crear una sesión nueva (nombre opcional). Al
crear, redirige automáticamente a `/panel/{sessionId}`.
* **`/panel/[sessionId]`** — vista del host: reproduce con el IFrame Player
real de YouTube, muestra la cola en vivo, permite **eliminar** y **saltar**
canciones, y abre el modal de QR/link para invitar. Al recargar, vuelve a
pedir el estado de la sesión al backend usando el `sessionId` de la URL, en
vez de reiniciar a la pantalla de creación.
* **`/join/[sessionId]`** — la que abre alguien al escanear el QR: busca
canciones (contra la YouTube Data API a través de tu backend) y las agrega
a la cola.

## Cómo quedó conectado

* `lib/api.ts`: toda la comunicación con el backend (REST para
crear/consultar sesión, buscar/agregar/eliminar/saltar canciones, WebSocket
para tiempo real) y los adaptadores que convierten la forma de datos del
backend Go a los tipos que usan los componentes.
* `components/collab/music-provider.tsx`: carga el estado inicial por REST,
se suscribe al WebSocket, y expone `addSong`, `reportEnded`, `skipCurrent`,
`removeItem`, `nowPlaying`, `queue`, `myRequests`, `connected`.
* `components/collab/client-view.tsx`: búsqueda con debounce (350ms) contra
`/api/search`.
* `components/collab/panel-view.tsx`: carga el **YouTube IFrame Player API**
dinámicamente, reproduce el `videoId` que indica `nowPlaying`, avisa al
backend (`reportEnded`) cuando el video termina o cuando el operador le da
a "Siguiente", y expone los controles de saltar/eliminar de la cola.
* `components/collab/session-qr-modal.tsx`: muestra el QR y el link de
`joinUrl` para compartir la sesión; se abre automáticamente al crear una
sesión y también desde el botón de invitar del panel.

## Nota sobre autoplay

Los navegadores exigen una interacción humana antes de permitir audio con
autoplay. Para el dispositivo fijo del panel, configura el navegador para
permitir autoplay con sonido en ese sitio específico (por ejemplo, en Chrome:
`chrome://settings/content/sound`, o lanzándolo con
`--autoplay-policy=no-user-gesture-required` en modo kiosco).

