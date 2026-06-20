import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import os from 'os';

const app = Fastify({ logger: false });

app.register(fastifyCors, { origin: true });
app.register(fastifyWebsocket);

const config = {
  interval: 1000,
  maxHistory: 60,
};

function cpuSnapshot() {
  let idle = 0, total = 0;
  for (const cpu of os.cpus()) {
    for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

app.register(async (fastify) => {
  // REST — returns server configuration consumed by the frontend before opening WS
  fastify.get('/config', async () => config);

  // REST — updates server configuration; new interval applies to future WS connections
  fastify.patch('/config', async (req) => {
    const body = req.body as Partial<typeof config>;
    if (typeof body.interval === 'number' && body.interval >= 200) {
      config.interval = body.interval;
    }
    if (typeof body.maxHistory === 'number' && body.maxHistory >= 10) {
      config.maxHistory = body.maxHistory;
    }
    return config;
  });

  // WebSocket — real system metrics
  fastify.get('/metrics', { websocket: true }, (socket) => {
    console.log('Client connected [real metrics].');
    let prev = cpuSnapshot();

    const interval = setInterval(() => {
      const curr = cpuSnapshot();
      const idleDiff = curr.idle - prev.idle;
      const totalDiff = curr.total - prev.total;
      const cpu = totalDiff === 0 ? 0 : Math.round(100 * (1 - idleDiff / totalDiff));
      prev = curr;

      const ram = Math.round(100 * (1 - os.freemem() / os.totalmem()));

      socket.send(JSON.stringify({ cpu, ram, timestamp: Date.now() }));
    }, config.interval);

    socket.on('close', () => {
      console.log('Client disconnected [real metrics].');
      clearInterval(interval);
    });
  });

  // WebSocket — random metrics for demos and UI testing
  fastify.get('/metrics/random', { websocket: true }, (socket) => {
    console.log('Client connected [random metrics].');

    const interval = setInterval(() => {
      socket.send(JSON.stringify({
        cpu: Math.floor(Math.random() * 100),
        ram: Math.floor(Math.random() * 100),
        timestamp: Date.now(),
      }));
    }, config.interval);

    socket.on('close', () => {
      console.log('Client disconnected [random metrics].');
      clearInterval(interval);
    });
  });
});

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
  console.log('REST endpoint:    http://localhost:3000/config');
  console.log('WebSocket:        ws://localhost:3000/metrics');
  console.log('WebSocket random: ws://localhost:3000/metrics/random');
});
