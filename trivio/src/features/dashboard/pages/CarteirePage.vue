<script setup lang="ts">
import { ref } from 'vue'
import ClientesPage from './ClientesPage.vue'
import ContratosPage from './ContratosPage.vue'

const activeTab = ref<'contratos' | 'clientes'>('contratos')
</script>

<template>
  <div class="carteira">
    <nav class="carteira-nav">
      <button
        class="carteira-tab"
        :class="{ 'carteira-tab--active': activeTab === 'contratos' }"
        @click="activeTab = 'contratos'"
      >
        Contratos
      </button>
      <button
        class="carteira-tab"
        :class="{ 'carteira-tab--active': activeTab === 'clientes' }"
        @click="activeTab = 'clientes'"
      >
        Clientes
      </button>
    </nav>
    <ContratosPage v-if="activeTab === 'contratos'" />
    <ClientesPage v-else />
  </div>
</template>

<style scoped>
.carteira {
  display: block;
  width: 100%;
}

.carteira-nav {
  display: flex;
  justify-content: center;
  margin-top: -1.5rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 640px) { .carteira-nav { margin-top: -2rem; margin-bottom: 2rem; } }
@media (min-width: 768px) { .carteira-nav { margin-top: -2.5rem; margin-bottom: 2.5rem; } }
@media (min-width: 1024px) { .carteira-nav { margin-top: -3rem; margin-bottom: 3rem; } }

.carteira-tab {
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

.carteira-tab:hover {
  color: var(--nd-text-primary);
}

.carteira-tab--active {
  color: var(--nd-text-display);
  border-bottom-color: var(--nd-sidebar-active-color);
}
</style>
