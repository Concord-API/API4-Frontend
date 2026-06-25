<script setup lang="ts">
import branding from '@/assets/branding.gif'
import AuthBrandingCopy from '@/features/auth/components/AuthBrandingCopy.vue'
import LoginForm from '@/features/auth/components/LoginForm.vue'
import BrandLogo from '@/shared/components/branding/BrandLogo.vue'
import ThemeToggleButton from '@/shared/components/theme/ThemeToggleButton.vue'
</script>

<template>
  <div
    class="relative grid min-h-svh overflow-hidden bg-background lg:grid-cols-[minmax(0,1fr)_minmax(23rem,28rem)]"
  >
    <section class="auth-hero relative hidden min-h-svh overflow-hidden lg:block">
      <div class="absolute top-4 right-6 left-6 z-10 hidden h-10 items-center justify-between xl:top-5 xl:right-8 xl:left-8 lg:flex">
        <a href="#" class="inline-flex h-9 items-center text-foreground no-underline">
          <BrandLogo />
        </a>
        <ThemeToggleButton />
      </div>

      <div class="relative grid h-full grid-cols-[minmax(20rem,0.95fr)_minmax(22rem,1.05fr)]">
        <div class="flex min-w-0 items-center justify-start pl-8 pr-4 xl:pl-14 xl:pr-8">
          <img
            :src="branding"
            alt="Branding animado do painel Trivio"
            class="auth-branding-art max-h-[76svh] w-full min-w-0 object-contain object-left"
          />
        </div>

        <div class="flex min-w-0 items-center justify-center px-8 xl:px-12">
          <AuthBrandingCopy />
        </div>
      </div>
    </section>

    <section
      class="flex min-h-svh min-w-0 flex-col border-b border-border bg-background px-4 pt-3 pb-4 sm:px-6 lg:border-b-0 lg:border-l"
    >
      <div class="flex h-11 items-center justify-between lg:hidden">
        <a href="#" class="inline-flex shrink-0 items-center text-foreground no-underline">
          <BrandLogo size="compact" />
        </a>
        <ThemeToggleButton class="shrink-0" />
      </div>

      <div class="flex flex-1 items-center py-8 sm:py-10 lg:py-0">
        <div
          class="flex w-full min-w-0 flex-col justify-center gap-8 md:grid md:grid-cols-[minmax(18rem,24rem)_minmax(14rem,1fr)] md:items-center md:gap-8 lg:block"
        >
          <LoginForm class="w-full max-w-sm md:max-w-md lg:max-w-none" />

          <div class="hidden min-w-0 space-y-5 md:block md:justify-self-end lg:hidden">
            <div class="flex justify-end">
              <img
                :src="branding"
                alt="Branding animado do painel Trivio"
                class="max-h-44 w-full min-w-0 object-contain object-right sm:max-h-52 md:max-h-48"
              />
            </div>

            <AuthBrandingCopy size="compact" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-hero {
  background: var(--nd-auth-hero-bg);
}

.auth-branding-art {
  filter: drop-shadow(0 24px 60px var(--nd-auth-art-shadow));
}
</style>
