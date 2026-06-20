<script setup lang="ts">
import { ref, watch } from 'vue';

interface Config {
  interval: number;
  maxHistory: number;
}

const props = defineProps<{ config: Config }>();
const emit = defineEmits<{ updated: [config: Config] }>();

const form = ref({ ...props.config });
const saving = ref(false);
const saved = ref(false);

watch(() => props.config, (val) => { form.value = { ...val }; });

async function save() {
  saving.value = true;
  saved.value = false;
  const res = await fetch('http://localhost:3000/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value),
  });
  const updated = await res.json() as Config;
  emit('updated', updated);
  saving.value = false;
  saved.value = true;
  setTimeout(() => { saved.value = false; }, 2000);
}
</script>

<template>
  <div class="config-card">
    <div class="config-header">
      <span class="config-label">Settings</span>
      <span v-if="saved" class="saved-badge">Saved</span>
    </div>

    <div class="fields">
      <label class="field">
        <span class="field-label">Update interval</span>
        <div class="input-row">
          <input
            v-model.number="form.interval"
            type="number"
            min="200"
            max="5000"
            step="100"
            class="input"
          />
          <span class="unit">ms</span>
        </div>
        <span class="hint">min 200 ms · current: {{ config.interval }} ms</span>
      </label>

      <label class="field">
        <span class="field-label">History size</span>
        <div class="input-row">
          <input
            v-model.number="form.maxHistory"
            type="number"
            min="10"
            max="300"
            step="10"
            class="input"
          />
          <span class="unit">pts</span>
        </div>
        <span class="hint">min 10 · current: {{ config.maxHistory }} pts</span>
      </label>
    </div>

    <button class="save-btn" :disabled="saving" @click="save">
      {{ saving ? 'Saving…' : 'Apply' }}
    </button>

    <p class="reconnect-note">
      Interval changes reconnect the WebSocket automatically.
    </p>
  </div>
</template>

<style scoped>
.config-card {
  background: #1e293b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.config-label {
  font-size: 0.875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.saved-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: #166534;
  color: #bbf7d0;
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.4rem;
  color: #f1f5f9;
  font-size: 1rem;
  padding: 0.4rem 0.75rem;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #60a5fa;
}

.unit {
  font-size: 0.8rem;
  color: #64748b;
  flex-shrink: 0;
}

.hint {
  font-size: 0.7rem;
  color: #475569;
}

.save-btn {
  width: 100%;
  background: #1d4ed8;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) { background: #2563eb; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.reconnect-note {
  font-size: 0.7rem;
  color: #475569;
  margin-top: 0.75rem;
  text-align: center;
}
</style>
