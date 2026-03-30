<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'
import { useTheme } from '@/shared/composables/useTheme'
import { cn } from '@/shared/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { mode, toggleTheme } = useTheme()
</script>

<template>
  <Button
    type="button"
    variant="ghost"
    size="icon"
    :class="cn('rounded-lg bg-transparent shadow-none hover:bg-primary/15', props.class)"
    :aria-label="mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
    @click="toggleTheme"
  >
    <Sun v-if="mode === 'dark'" class="text-white" />
    <Moon v-else class="text-black" />
  </Button>
</template>
