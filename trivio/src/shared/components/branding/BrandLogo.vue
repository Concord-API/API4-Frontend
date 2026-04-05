<script setup lang="ts">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import logoBranco from '@/assets/trivio branco.svg'
import logoPreto from '@/assets/trivio preto.svg'
import { useTheme } from '@/shared/composables/useTheme'
import { cn } from '@/shared/lib/utils'

type BrandLogoSize = 'compact' | 'default'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    size?: BrandLogoSize
  }>(),
  {
    size: 'default',
  },
)

const { mode } = useTheme()

const logoSrc = computed(() => mode.value === 'dark' ? logoBranco : logoPreto)

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
