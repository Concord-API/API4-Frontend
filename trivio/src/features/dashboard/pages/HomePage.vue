<script setup lang="ts">
import { useAuth } from '@/shared/composables/useAuth'

const { currentUser } = useAuth()
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-3xl font-bold tracking-tight">
      Bem-vindo de volta, {{ currentUser?.email?.split('@')[0] || 'Usuário' }}
    </h1>
    <p class="text-muted-foreground">
      Visão consolidada das suas operações e manutenções ativas.
    </p>
  </div>
</template>