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
const dialogRef = ref<HTMLDialogElement | null>(null);
let ws: WebSocket | null = null;

function barColor(value: number): string {
  if (value >= 80) return '#ef4444';
  if (value >= 60) return '#f59e0b';
  return '#22c55e';
}

onMounted(async () => {
  const res = await fetch('http://localhost:3000/config');
  config.value = await res.json() as Config;
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
      <div class="header-right">
        <span :class="['badge', status.toLowerCase()]">{{ status }}</span>
        <button class="settings-btn" title="Settings" @click="dialogRef?.showModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
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
          <div class="bar-fill" :style="{ width: cpu + '%', background: barColor(cpu) }"></div>
        </div>
        <div class="card-value">{{ cpu }}%</div>
      </div>

      <div class="card">
        <div class="card-label">RAM Usage</div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: ram + '%', background: barColor(ram) }"></div>
        </div>
        <div class="card-value">{{ ram }}%</div>
      </div>

      <HistoryChart
        :cpu-history="cpuHistory"
        :ram-history="ramHistory"
        :max-history="config.maxHistory"
      />
    </div>

    <dialog ref="dialogRef" class="settings-dialog">
      <div class="dialog-header">
        <span class="dialog-title">Settings</span>
        <button class="close-btn" @click="dialogRef?.close()">✕</button>
      </div>
      <ConfigPanel :config="config" @updated="onConfigUpdated" />
    </dialog>
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
  justify-content: space-between;
  width: 100%;
  max-width: 480px;
  margin-bottom: 0.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  width: 100%;
  max-width: 480px;
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

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e293b;
  border: none;
  border-radius: 0.5rem;
  color: #94a3b8;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.settings-btn:hover {
  background: #334155;
  color: #f1f5f9;
}

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

/* dialog */
.settings-dialog {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 0;
  width: min(480px, 90vw);
  color: #f1f5f9;
}

.settings-dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0;
  margin-bottom: 0.25rem;
}

.dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #f1f5f9;
}
</style>
