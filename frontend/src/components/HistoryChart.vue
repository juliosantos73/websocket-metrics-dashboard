<script setup lang="ts">
import { computed } from 'vue';

const MAX = 60;

const props = defineProps<{
  cpuHistory: number[];
  ramHistory: number[];
}>();

// SVG viewBox: x 0-600 maps to time, y 0-100 maps to 100%-0% (inverted).
// Uses cubic Bézier curves (C command): control points share the midpoint X
// between consecutive data points, producing smooth S-curves.
function toSmoothPath(data: number[]): string {
  if (data.length < 2) return '';
  const pts = data.map((v, i) => ({
    x: (i / (MAX - 1)) * 600,
    y: 100 - v,
  }));
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const mx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${mx},${p0.y.toFixed(1)} ${mx},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return d;
}

const cpuLine = computed(() => toSmoothPath(props.cpuHistory));
const ramLine = computed(() => toSmoothPath(props.ramHistory));
</script>

<template>
  <div class="chart-card">
    <div class="chart-header">
      <span class="chart-label">History <span class="sub">(last 60 s)</span></span>
      <div class="legend">
        <span class="dot" style="background: #4ade80"></span>CPU
        <span class="dot" style="background: #60a5fa"></span>RAM
      </div>
    </div>

    <div class="chart-body">
      <div class="y-axis">
        <span>100%</span>
        <span>75%</span>
        <span>50%</span>
        <span>25%</span>
        <span>0%</span>
      </div>

      <svg viewBox="0 0 600 100" preserveAspectRatio="none" class="chart-svg">
        <!-- horizontal grid lines at 0, 25, 50, 75, 100 % -->
        <line
          v-for="pct in [0, 25, 50, 75, 100]"
          :key="pct"
          x1="0" :y1="100 - pct"
          x2="600" :y2="100 - pct"
          stroke="#334155" stroke-width="0.5"
        />

        <path
          :d="cpuLine"
          fill="none"
          stroke="#4ade80"
          stroke-width="1.5"
          stroke-linecap="round"
        />

        <path
          :d="ramLine"
          fill="none"
          stroke="#60a5fa"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: #1e293b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.chart-label {
  font-size: 0.875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sub {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.2rem;
  vertical-align: middle;
}

.chart-body {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #475569;
  text-align: right;
  width: 2.25rem;
  flex-shrink: 0;
  padding: 1px 0;
}

.chart-svg {
  flex: 1;
  height: 120px;
  display: block;
  background: #0f172a;
  border-radius: 0.25rem;
}
</style>
