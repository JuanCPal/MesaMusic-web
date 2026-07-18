# MesaMusic-web

Frontend en Next.js del sistema de música colaborativa vía QR. Se conecta al
backend Go (`mesamusic-api`) por REST + WebSocket para búsqueda,
cola compartida en tiempo real y reproducción vía YouTube IFrame Player.

## Conectar con el backend

1. Asegúrate de que `mesamusic-api` esté corriendo (por defecto en
`http://localhost:8080`, ver su propio README).
2. Copia el archivo de entorno:

```bash
   cp .env.local.example .env.local
   ```

3. Si tu backend corre en otra URL/puerto, edita `.env.local`:

```
   NEXT\_PUBLIC\_API\_URL=http://localhost:8080
   NEXT\_PUBLIC\_WS\_URL=ws://localhost:8080/ws
   ```

## Instalar y correr

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Hay dos vistas, cambiables con el switcher
flotante abajo:

* **Cliente**: la que abre alguien al escanear el QR — busca canciones (contra
la YouTube Data API a través de tu backend) y las agrega a la cola.
* **Panel**: la que queda abierta en el dispositivo/tablet del sitio —
reproduce con el IFrame Player real de YouTube y muestra la cola.

## Cómo quedó conectado

* `lib/api.ts`: toda la comunicación con el backend (REST para buscar/agregar/
consultar estado, WebSocket para tiempo real) y los adaptadores que
convierten la forma de datos del backend Go a los tipos que usan los
componentes.
* `components/collab/music-provider.tsx`: ya no simula nada — carga el estado
inicial por REST, se suscribe al WebSocket, y expone `addSong`,
`reportEnded`, `nowPlaying`, `queue`, `myRequests`, `connected`.
* `components/collab/client-view.tsx`: búsqueda con debounce (350ms) contra
`/api/search`, más un campo opcional de "nombre o mesa" que se guarda en
`localStorage` y se manda con cada canción que agregues.
* `components/collab/panel-view.tsx`: carga el **YouTube IFrame Player API**
dinámicamente, reproduce el `videoId` que indica `nowPlaying`, y avisa al
backend (`reportEnded`) cuando el video termina o cuando el operador le da
a "Siguiente".

## Nota sobre autoplay

Los navegadores exigen una interacción humana antes de permitir audio con
autoplay. Para el dispositivo fijo del panel, configura el navegador para
permitir autoplay con sonido en ese sitio específico (por ejemplo, en Chrome:
`chrome://settings/content/sound`, o lanzándolo con
`--autoplay-policy=no-user-gesture-required` en modo kiosco).

