import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import os from 'os';

const app = Fastify({ logger: false });
app.register(fastifyWebsocket);

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
  // Real system metrics — compares CPU snapshots between each tick
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
    }, 1000);

    socket.on('close', () => {
      console.log('Client disconnected [real metrics].');
      clearInterval(interval);
    });
  });

  // Random metrics — useful for demos and UI testing without real system data
  fastify.get('/metrics/random', { websocket: true }, (socket) => {
    console.log('Client connected [random metrics].');

    const interval = setInterval(() => {
      socket.send(JSON.stringify({
        cpu: Math.floor(Math.random() * 100),
        ram: Math.floor(Math.random() * 100),
        timestamp: Date.now(),
      }));
    }, 1000);

    socket.on('close', () => {
      console.log('Client disconnected [random metrics].');
      clearInterval(interval);
    });
  });
});

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
  console.log('WebSocket server running at ws://localhost:3000/metrics');
  console.log('Random metrics available at  ws://localhost:3000/metrics/random');
});
