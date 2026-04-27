<script setup lang="ts">
import { ref } from 'vue'
import TecnicosPage from './TecnicosPage.vue'
import RequisitosPage from './RequisitosPage.vue'

const activeTab = ref<'tecnicos' | 'requisitos'>('tecnicos')
</script>

<template>
  <div class="equipe">
    <nav class="equipe-nav">
      <button
        class="equipe-tab"
        :class="{ 'equipe-tab--active': activeTab === 'tecnicos' }"
        @click="activeTab = 'tecnicos'"
      >
        Técnicos
      </button>
      <button
        class="equipe-tab"
        :class="{ 'equipe-tab--active': activeTab === 'requisitos' }"
        @click="activeTab = 'requisitos'"
      >
        Requisitos
      </button>
    </nav>
    <TecnicosPage v-if="activeTab === 'tecnicos'" />
    <RequisitosPage v-else />
  </div>
</template>

<style scoped>
.equipe {
  display: block;
  width: 100%;
}

.equipe-nav {
  display: flex;
  justify-content: center;
  margin-top: -1.5rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 640px) { .equipe-nav { margin-top: -2rem; margin-bottom: 2rem; } }
@media (min-width: 768px) { .equipe-nav { margin-top: -2.5rem; margin-bottom: 2.5rem; } }
@media (min-width: 1024px) { .equipe-nav { margin-top: -3rem; margin-bottom: 3rem; } }

.equipe-tab {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--nd-text-disabled);
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--nd-border);
  padding: 10px 20px;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 150ms ease-out, border-color 150ms ease-out;
}

.equipe-tab:hover {
  color: var(--nd-text-primary);
}

.equipe-tab--active {
  color: var(--nd-text-display);
  border-bottom-color: var(--nd-sidebar-active-color);
}
</style>
