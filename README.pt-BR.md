# websocket-metrics-dashboard

🌐 [English](README.md) | [Português](README.pt-BR.md)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vue.js](https://img.shields.io/badge/Vue.js-3-brightgreen?logo=vue.js)
![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify)

Um guia prático de WebSockets: um dashboard de métricas em tempo real onde um backend Node.js/Fastify transmite continuamente dados simulados de CPU e RAM para um frontend Vue.js através de uma conexão WebSocket persistente.

---

## Como funciona

Após um handshake HTTP inicial (atualização de protocolo), um canal bidirecional persistente é estabelecido. O servidor envia um novo snapshot de métricas a cada segundo, sem que o cliente precise pedir.

```
Navegador (Vue.js)                Servidor (Fastify)
       │──── HTTP GET /metrics ──────────► │
       │◄─── 101 Switching Protocols ──────┤
       │                                   │
       │◄─── { cpu: 42, ram: 67 } ─────────┤  a cada 1 s
       │◄─── { cpu: 38, ram: 71 } ─────────┤
       │◄─── { cpu: 55, ram: 65 } ─────────┤
       │                                   │
       │──── close ─────────────────────── │  (aba fechada / componente destruído)
```

---

## Funcionalidades

- Server push a cada 1 segundo — sem polling
- Barras de progresso com cores dinâmicas (verde → âmbar → vermelho) indicando nível de carga
- Badge de status reativo (Conectando / Conectado / Desconectado / Erro)
- Seguro contra vazamento de memória: `clearInterval` é chamado assim que o cliente desconecta
- Código limpo e tipado — TypeScript nos dois lados

---

## Pré-requisitos

- Node.js 20+
- npm 9+

---

## Instalação e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/juliosantos73/websocket-metrics-dashboard.git
cd websocket-metrics-dashboard
```

### 2. Instalar todas as dependências

```bash
npm install
```

Um único comando instala as dependências do `backend` e do `frontend` via npm workspaces.

### 3. Iniciar os dois servidores

```bash
npm run dev
```

Backend e frontend sobem de forma concorrente:

| Serviço  | URL                              |
|----------|----------------------------------|
| Backend  | `ws://localhost:3000/metrics`    |
| Frontend | `http://localhost:5173`          |

Acesse `http://localhost:5173` no navegador e observe as métricas atualizando em tempo real.

> **Executando os serviços individualmente:** Para deploys em servidores separados (staging, produção), instale e execute cada um de forma independente:
> ```bash
> cd backend && npm install && npm run dev
> cd frontend && npm install && npm run dev
> ```
> Ou a partir da raiz do repositório usando flags de workspace:
> ```bash
> npm run dev -w backend
> npm run dev -w frontend
> ```

---

## Estrutura do projeto

```
websocket-metrics-dashboard/
├── backend/                 # Servidor WebSocket com Fastify
│   ├── src/
│   │   └── server.ts        # Definição da rota e emissor de métricas
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Dashboard Vue 3
│   ├── src/
│   │   ├── App.vue          # UI reativa + lógica WebSocket
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## Conceitos fundamentais

### O problema — overhead do HTTP polling

No HTTP tradicional, obter dados em tempo real exige *polling*: o cliente pergunta ao servidor a cada N segundos se há novidades. Cada requisição carrega cabeçalhos HTTP completos (cookies, tokens de auth, user-agent etc.), gerando tráfego de rede desnecessário mesmo quando nada mudou.

```
Cliente      Servidor
  │─ GET /data ─►│
  │◄── 200 ──────│   (t = 0 s)
  │─ GET /data ─►│
  │◄── 200 ──────│   (t = 1 s)  ← cabeçalhos repetidos a cada vez
  │─ GET /data ─►│
  │◄── 200 ──────│   (t = 2 s)
```

### A solução — WebSocket

O WebSocket realiza um único handshake HTTP e então atualiza a conexão para um canal TCP direto. As mensagens subsequentes trafegam como frames leves (com apenas 2 bytes de overhead), e o servidor pode enviar dados no exato momento em que são gerados.

### Prevenção de vazamento de memória

O backend atribui o `setInterval` a uma variável e chama `clearInterval` dentro do handler `socket.on('close')`. Sem essa limpeza, um cliente desconectado deixaria um timer rodando indefinidamente — um interval vazando por conexão órfã.

---

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Faça commit das alterações: `git commit -m 'Adiciona sua feature'`
4. Faça push: `git push origin feature/sua-feature`
5. Abra um Pull Request

Mantenha os PRs focados — uma feature ou correção por PR.

---

## Licença

[MIT](LICENSE) — © Júlio César Santos
