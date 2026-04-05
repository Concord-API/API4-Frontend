export function apenasDigitos(value: string): string {
  return value.replace(/\D/g, '')
}

export const onlyDigits = apenasDigitos

export function formatarCpf(value: string | null | undefined): string {
  const digits = apenasDigitos(value ?? '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export const formatCpf = formatarCpf

export function formatCnpj(value: string | null | undefined): string {
  const digits = apenasDigitos(value ?? '').slice(0, 14)

  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export const formatarCnpj = formatCnpj

function normalizePhoneDigits(value: string | null | undefined): string {
  const digits = apenasDigitos(value ?? '')

  if (digits.length > 11 && digits.startsWith('55')) {
    return digits.slice(2, 13)
  }

  return digits.slice(0, 11)
}

export function formatPhone(value: string | null | undefined): string {
  const digits = normalizePhoneDigits(value)

  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export const formatarTelefone = formatPhone

export function formatCpfOrCnpj(value: string | null | undefined): string {
  const digits = apenasDigitos(value ?? '')

  if (digits.length > 11) {
    return formatCnpj(digits)
  }

  return formatCpf(digits)
}

export const ApenasDigitos = apenasDigitos
export const formatarCpfOuCnpj = formatCpfOrCnpj
