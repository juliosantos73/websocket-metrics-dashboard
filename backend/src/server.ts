import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const app = Fastify({ logger: false });

app.register(fastifyWebsocket);

app.register(async (fastify) => {
  fastify.get('/metrics', { websocket: true }, (socket) => {
    console.log('Client connected.');

    const interval = setInterval(() => {
      const payload = JSON.stringify({
        cpu: Math.floor(Math.random() * 100),
        ram: Math.floor(Math.random() * 100),
        timestamp: Date.now(),
      });
      socket.send(payload);
    }, 1000);

    socket.on('close', () => {
      console.log('Client disconnected.');
      clearInterval(interval);
    });
  });
});

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
  console.log('WebSocket server running at ws://localhost:3000/metrics');
});
