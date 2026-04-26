<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { useAuth } from '@/shared/composables/useAuth'
import { getApiErrorMessage } from '@/shared/services/api'
import { toast } from 'vue-sonner'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

async function handleSubmit(e: Event) {
  e.preventDefault()
  isLoading.value = true
  
  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    console.error(err)
    toast.error(getApiErrorMessage(err))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit="handleSubmit" :class="cn('flex w-full flex-col gap-8', props.class)">
    <div class="space-y-2 text-center">
      <h1 class="text-3xl font-bold tracking-[-0.04em] text-foreground">Entrar</h1>
      <p class="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
        Entre com sua conta para acessar o painel de controle do Trivio.
      </p>
    </div>

    <FieldGroup class="gap-5">
      <Field class="gap-2">
        <FieldLabel for="email" class="text-sm font-medium text-foreground"> Email </FieldLabel>
        <Input
          id="email"
          type="email"
          v-model="email"
          placeholder="Digite seu email"
          required
          class="h-11 rounded-xl px-4"
        />
      </Field>

      <Field class="gap-2">
        <div class="flex items-center gap-3">
          <FieldLabel for="password" class="text-sm font-medium text-foreground">
            Senha
          </FieldLabel>
          <a href="#" class="ml-auto text-sm text-secundary underline-offset-4 transition-colors hover:underline">
            Esqueceu sua senha?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          v-model="password"
          placeholder="Digite sua senha"
          required
          class="h-11 rounded-xl px-4"
        />
      </Field>

      <Field>
        <Button :disabled="isLoading" type="submit" size="lg" class="h-11 w-full rounded-xl text-sm font-semibold shadow-none">
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
        </Button>
      </Field>
    </FieldGroup>
  </form>
</template>
