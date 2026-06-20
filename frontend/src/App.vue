<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HistoryChart from './components/HistoryChart.vue';
import ConfigPanel from './components/ConfigPanel.vue';

interface Config {
  interval: number;
  maxHistory: number;
}

interface Metrics {
  cpu: number;
  ram: number;
  timestamp: number;
}

const config = ref<Config>({ interval: 1000, maxHistory: 60 });
const cpu = ref(0);
const ram = ref(0);
const cpuHistory = ref<number[]>([]);
const ramHistory = ref<number[]>([]);
const status = ref<'Connecting' | 'Connected' | 'Disconnected' | 'Error'>('Connecting');
let ws: WebSocket | null = null;

function barColor(value: number): string {
  if (value >= 80) return '#ef4444';
  if (value >= 60) return '#f59e0b';
  return '#22c55e';
}

onMounted(async () => {
  // REST: fetch server config before opening the WebSocket connection
  const res = await fetch('http://localhost:3000/config');
  config.value = await res.json() as Config;

  // WebSocket: open persistent channel for real-time metrics
  connectWs();
});

function connectWs() {
  ws?.close();
  cpuHistory.value = [];
  ramHistory.value = [];
  status.value = 'Connecting';

  ws = new WebSocket('ws://localhost:3000/metrics');
  ws.onopen = () => { status.value = 'Connected'; };
  ws.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data) as Metrics;
    cpu.value = data.cpu;
    ram.value = data.ram;
    cpuHistory.value = [...cpuHistory.value, data.cpu].slice(-config.value.maxHistory);
    ramHistory.value = [...ramHistory.value, data.ram].slice(-config.value.maxHistory);
  };
  ws.onerror = () => { status.value = 'Error'; };
  ws.onclose = () => { status.value = 'Disconnected'; };
}

function onConfigUpdated(updated: Config) {
  const intervalChanged = updated.interval !== config.value.interval;
  config.value = updated;
  if (intervalChanged) connectWs();
}

onUnmounted(() => {
  ws?.close();
});
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <h1>Server Metrics</h1>
      <span :class="['badge', status.toLowerCase()]">{{ status }}</span>
    </header>

    <p class="config-info">
      updating every {{ config.interval / 1000 }} s
      &nbsp;·&nbsp;
      history: {{ config.maxHistory }} data points
    </p>

    <div class="cards">
      <div class="card">
        <div class="card-label">CPU Usage</div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ width: cpu + '%', background: barColor(cpu) }"
          ></div>
        </div>
        <div class="card-value">{{ cpu }}%</div>
      </div>

      <div class="card">
        <div class="card-label">RAM Usage</div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ width: ram + '%', background: barColor(ram) }"
          ></div>
        </div>
        <div class="card-value">{{ ram }}%</div>
      </div>

      <HistoryChart
        :cpu-history="cpuHistory"
        :ram-history="ramHistory"
        :max-history="config.maxHistory"
      />

      <ConfigPanel :config="config" @updated="onConfigUpdated" />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #0f172a;
  color: #f1f5f9;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.config-info {
  font-size: 0.75rem;
  color: #475569;
  margin-bottom: 2rem;
}

.badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge.connected    { background: #166534; color: #bbf7d0; }
.badge.connecting   { background: #713f12; color: #fef3c7; }
.badge.disconnected { background: #1e293b; color: #94a3b8; }
.badge.error        { background: #7f1d1d; color: #fecaca; }

.cards {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 480px;
}

.card {
  background: #1e293b;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.card-label {
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bar-track {
  background: #0f172a;
  border-radius: 9999px;
  height: 1rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease, background 0.4s ease;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  text-align: right;
}
</style>
