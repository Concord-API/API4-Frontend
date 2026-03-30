<script setup lang="ts">
import branding from '@/assets/branding.gif'
import LoginForm from '@/features/auth/components/LoginForm.vue'
import BrandLogo from '@/shared/components/branding/BrandLogo.vue'
import ThemeToggleButton from '@/shared/components/theme/ThemeToggleButton.vue'
</script>

<template>
  <div
    class="relative grid min-h-svh bg-white lg:grid-cols-[1fr_minmax(24rem,27rem)] dark:bg-black"
  >
    <section class="relative hidden min-h-svh overflow-hidden bg-white lg:block dark:bg-black">
      <div class="absolute top-3 right-6 left-6 z-10 hidden h-9 items-center justify-between xl:top-4 xl:right-8 xl:left-8 lg:flex">
        <a href="#" class="inline-flex h-9 items-center text-foreground no-underline">
          <BrandLogo />
        </a>
        <ThemeToggleButton />
      </div>

      <div class="grid h-full grid-cols-2">
        <div class="flex items-center justify-start pl-12 pr-6 xl:pl-16 xl:pr-8">
          <img
            :src="branding"
            alt="Branding animado do painel Trivio"
            class="max-h-[72svh] w-full object-contain object-left"
          />
        </div>

        <div class="flex items-center justify-center px-8 xl:px-12">
          <div class="space-y-7">
            <h2
              class="max-w-md text-5xl leading-[1.02] font-bold tracking-[-0.06em] text-black dark:text-white xl:text-6xl"
            >
              Conecte pessoas, dados e
              <span
                class="inline-block rounded-[0.12em] bg-[#b9f11b] px-[0.16em] pt-[0.02em] pb-[0.08em] text-[#111827] shadow-[0_0_0_1px_rgba(185,241,27,0.08)]"
              >
                decisoes
              </span>
              em um so lugar.
            </h2>
            <p class="max-w-md text-lg leading-8 text-black/70 dark:text-white/72">
              Um espaco central para acompanhar operacoes, manter visibilidade do que importa e
              transformar informacoes em acoes.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      class="flex min-h-svh flex-col border-b border-black/10 bg-white px-10 pt-1.5 pb-2 sm:px-6 sm:pt-1.5 sm:pb-2 lg:border-b-0 lg:border-l dark:border-white/10 dark:bg-black"
    >
      <div class="flex h-10 items-center justify-between lg:hidden">
        <a href="#" class="inline-flex shrink-0 items-center text-foreground no-underline">
          <BrandLogo size="compact" />
        </a>
        <ThemeToggleButton class="shrink-0" />
      </div>

      <div class="flex flex-1 items-center py-10 sm:py-12 lg:py-0">
        <div
          class="flex w-full flex-col justify-center gap-10 md:grid md:grid-cols-[minmax(18rem,22rem)_minmax(16rem,1fr)] md:items-center md:gap-10 lg:block"
        >
          <LoginForm class="w-full max-w-sm" />

          <div class="hidden space-y-5 md:block md:justify-self-end lg:hidden">
            <div class="flex justify-end">
              <img
                :src="branding"
                alt="Branding animado do painel Trivio"
                class="max-h-44 w-full object-contain object-right sm:max-h-52 md:max-h-48 "
              />
            </div>

            <div class="space-y-4">
              <h2
                class="max-w-sm text-3xl leading-[1.04] font-bold tracking-[-0.06em] text-black dark:text-white sm:text-4xl"
              >
                Conecte pessoas, dados e
                <span
                  class="inline-block rounded-[0.12em] bg-[#b9f11b] px-[0.16em] pt-[0.02em] pb-[0.08em] text-[#111827] shadow-[0_0_0_1px_rgba(185,241,27,0.08)]"
                >
                  decisoes
                </span>
                em um so lugar.
              </h2>
              <p
                class="max-w-sm text-sm leading-6 text-black/70 dark:text-white/72 sm:text-base sm:leading-7"
              >
                Um espaco central para acompanhar operacoes, manter visibilidade do que importa e
                transformar informacoes em acoes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
