<script setup lang="ts">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import logoBranco from '@/assets/trivio branco.svg'
import logoPreto from '@/assets/trivio preto.svg'
import { useTheme } from '@/shared/composables/useTheme'
import { cn } from '@/shared/lib/utils'

type BrandLogoSize = 'compact' | 'default'
type BrandLogoTone = 'auto' | 'onDark' | 'onLight'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    size?: BrandLogoSize
    tone?: BrandLogoTone
  }>(),
  {
    size: 'default',
    tone: 'auto',
  },
)

const { mode } = useTheme()

const logoSrc = computed(() => {
  if (props.tone === 'onDark') return logoBranco
  if (props.tone === 'onLight') return logoPreto
  return mode.value === 'dark' ? logoBranco : logoPreto
})

const imgClasses = computed(() =>
  props.size === 'compact'
    ? 'h-5 sm:h-6 w-auto'
    : 'h-7 xl:h-8 w-auto',
)
</script>

<template>
  <span :class="cn('inline-flex items-center', props.class)">
    <img :src="logoSrc" alt="Trivio" :class="imgClasses" />
  </span>
</template>
