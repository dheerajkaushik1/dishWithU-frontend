# Dish With U

React, Vite, Tailwind CSS, and Socket.IO client for the deployed Dish With U backend.

## Run locally

```sh
npm install
npm run dev
```

The API defaults to `https://dishwithu.onrender.com`. To point at another API, copy `.env.example` to `.env.local` and set `VITE_API_URL`.

## Backend integration

The frontend uses the existing `/api/auth` and `/api/rooms` endpoints, JWT bearer authentication, authenticated Socket.IO room membership, presence notifications, and the backend's WebRTC offer/answer/ICE relay. Local host video is captured in the browser and is never uploaded.

The deployed API currently has no message/reaction events, playback-control events, room theme field, room-list endpoint, or participant-removal endpoint. The room identifies chat and shared themes as unavailable instead of simulating them. Native host video playback is sent as a live media stream; synchronized seek/playback controls require backend support.

## Checks

```sh
npm run lint
npm run build
```
