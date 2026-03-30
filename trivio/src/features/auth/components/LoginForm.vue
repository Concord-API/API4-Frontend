<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <form :class="cn('flex w-full flex-col gap-8', props.class)">
    <div class="space-y-2 text-center">
      <h1 class="text-3xl font-bold tracking-[-0.04em] text-foreground">Entrar</h1>
      <p class="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
        Entre com sua conta para acessar o painel de controle do Trivio.
      </p>
    </div>

    <FieldGroup class="gap-5">
      <Field class="gap-2">
        <FieldLabel for="email" class="text-sm font-medium text-foreground"> Email </FieldLabel>
        <Input id="email" type="email" placeholder="m@example.com" required
          class="h-11 rounded-xl border-border/70 bg-background px-4 shadow-none" />
      </Field>

      <Field class="gap-2">
        <div class="flex items-center gap-3">
          <FieldLabel for="password" class="text-sm font-medium text-foreground">
            Senha
          </FieldLabel>
          <a href="#" class="ml-auto text-sm text-primary underline-offset-4 transition-colors hover:underline">
            Esqueceu sua senha?
          </a>
        </div>
        <Input id="password" type="password" placeholder="Digite sua senha" required
          class="h-11 rounded-xl border-border/70 bg-background px-4 shadow-none" />
      </Field>

      <Field>
        <Button type="submit" size="lg" class="h-11 w-full rounded-xl text-sm font-semibold shadow-none">
          Entrar
        </Button>
      </Field>
    </FieldGroup>
  </form>
</template>
