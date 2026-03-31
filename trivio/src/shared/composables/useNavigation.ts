import { computed } from 'vue'
import { useAuth } from './useAuth'
import type { RouteLocationRaw } from 'vue-router'
import { Home, Users, Settings, Package, Wrench, Calendar, MapPin, History } from 'lucide-vue-next'

export interface NavigationItem {
  id: string
  title: string
  icon: any
  route: RouteLocationRaw
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

export function useNavigation() {
  const { currentUser } = useAuth()

  const menuGroups = computed<NavigationGroup[]>(() => {
    const role = currentUser.value?.role

    if (role === 'manager') {
      return [
        {
          title: 'Gestão Operacional',
          items: [
            { id: '1', title: 'Visão Geral', icon: Home, route: { name: 'dashboard-home' } },
            { id: '2', title: 'Clientes', icon: Users, route: { name: 'dashboard-clientes' } },
            { id: '3', title: 'Equipamentos', icon: Package, route: { name: 'dashboard-equipamentos' } },
            { id: '4', title: 'Manutenções', icon: Wrench, route: { name: 'dashboard-manutencoes' } },
            { id: '5', title: 'Técnicos & Alocação', icon: Settings, route: { name: 'dashboard-tecnicos' } }
          ]
        }
      ]
    }

    if (role === 'technician') {
      return [
        {
          title: 'Rotina de Campo',
          items: [
            { id: '1', title: 'Minha Agenda', icon: Calendar, route: { name: 'dashboard-home' } },
            { id: '2', title: 'Locais de Atendimento', icon: MapPin, route: { name: 'dashboard-locais' } },
            { id: '3', title: 'Histórico de Execução', icon: History, route: { name: 'dashboard-historico' } }
          ]
        }
      ]
    }

    return []
  })

  return {
    menuGroups
  }
}
