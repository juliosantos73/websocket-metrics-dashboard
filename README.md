# websocket-metrics-dashboard

🌐 [English](README.md) | [Português](README.pt-BR.md)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vue.js](https://img.shields.io/badge/Vue.js-3-brightgreen?logo=vue.js)
![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify)

A practical guide to WebSockets: a real-time metrics dashboard where a Node.js/Fastify backend continuously streams simulated CPU and RAM data to a Vue.js frontend over a persistent WebSocket connection.

---

## How it works

After an initial HTTP handshake (protocol upgrade), a persistent bidirectional channel is established. The server pushes a new metrics snapshot every second without the client ever having to ask.

```
Browser (Vue.js)                  Server (Fastify)
       │──── HTTP GET /metrics ──────────► │
       │◄─── 101 Switching Protocols ──────┤
       │                                   │
       │◄─── { cpu: 42, ram: 67 } ─────────┤  every 1 s
       │◄─── { cpu: 38, ram: 71 } ─────────┤
       │◄─── { cpu: 55, ram: 65 } ─────────┤
       │                                   │
       │──── close ─────────────────────── │  (tab closed / component destroyed)
```

---

## Features

- Server push at 1-second intervals — no polling required
- Colour-coded progress bars (green → amber → red) reflecting load levels
- Reactive status badge (Connecting / Connected / Disconnected / Error)
- Memory-safe: `clearInterval` is called the moment the client disconnects
- Clean, type-safe code — TypeScript on both ends

---

## Prerequisites

- Node.js 20+
- npm 9+

---

## Installation and running

### 1. Clone the repository

```bash
git clone https://github.com/juliosantos73/websocket-metrics-dashboard.git
cd websocket-metrics-dashboard
```

### 2. Install all dependencies

```bash
npm install
```

This single command installs dependencies for both `backend` and `frontend` via npm workspaces.

### 3. Start both servers

```bash
npm run dev
```

The backend and frontend start concurrently:

| Service  | URL                              |
|----------|----------------------------------|
| Backend  | `ws://localhost:3000/metrics`    |
| Frontend | `http://localhost:5173`          |

Open `http://localhost:5173` in your browser and watch the metrics update in real time.

> **Running services independently:** If you are deploying backend and frontend to separate servers, install and run each one individually:
> ```bash
> cd backend && npm install && npm run dev
> cd frontend && npm install && npm run dev
> ```
> Or from the repository root using workspace flags:
> ```bash
> npm run dev -w backend
> npm run dev -w frontend
> ```

---

## Project structure

```
websocket-metrics-dashboard/
├── backend/                 # Fastify WebSocket server
│   ├── src/
│   │   └── server.ts        # Route definition and metrics emitter
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Vue 3 dashboard
│   ├── src/
│   │   ├── App.vue          # Reactive UI + WebSocket logic
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## Key concepts

### The problem — HTTP polling overhead

In traditional HTTP, obtaining real-time data requires *polling*: the client asks the server every N seconds whether there is anything new. Every request carries full HTTP headers (cookies, auth tokens, user-agent, etc.), generating unnecessary network traffic even when nothing has changed.

```
Client       Server
  │─ GET /data ─►│
  │◄── 200 ──────│   (t = 0 s)
  │─ GET /data ─►│
  │◄── 200 ──────│   (t = 1 s)  ← repeated headers every time
  │─ GET /data ─►│
  │◄── 200 ──────│   (t = 2 s)
```

### The solution — WebSocket

WebSocket performs a one-time HTTP handshake and then upgrades the connection to a raw TCP channel. Subsequent messages travel as lightweight frames (as small as 2 bytes of overhead), and the server can push data the instant it is available.

### Memory leak prevention

The backend assigns the `setInterval` to a variable and calls `clearInterval` inside the `socket.on('close')` handler. Without this cleanup, a disconnected client would leave a timer running indefinitely — one leaked interval per connection.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep PRs focused — one feature or fix per PR.

---

## License

[MIT](LICENSE) — © Júlio César Santos
