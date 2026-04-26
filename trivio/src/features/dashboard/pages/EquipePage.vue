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
  margin-bottom: 32px;
}

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
