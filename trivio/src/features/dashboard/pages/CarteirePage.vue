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
  margin-bottom: 32px;
}

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
