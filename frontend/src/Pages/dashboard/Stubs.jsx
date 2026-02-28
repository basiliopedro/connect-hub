// Stub pages — serão desenvolvidas na FASE 5 (Chat e Pagamentos)

import { MessageSquare, CreditCard, User, Settings } from 'lucide-react'
import { EmptyState, Card } from '@/components/ui'

export function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-syne font-black text-2xl">Mensagens</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">Chat com clientes e profissionais</p>
      </div>
      <Card>
        <EmptyState
          icon={<MessageSquare size={24} className="text-[var(--muted)]" />}
          title="Chat em tempo real — Fase 5"
          description="Quando tiveres contratos activos, poderás trocar mensagens directamente com a outra parte. Esta funcionalidade chegará na próxima fase."
        />
      </Card>
    </div>
  )
}

export function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-syne font-black text-2xl">Pagamentos</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">Histórico financeiro e escrow</p>
      </div>
      <Card>
        <EmptyState
          icon={<CreditCard size={24} className="text-[var(--muted)]" />}
          title="Pagamentos via Stripe — Fase 5"
          description="O sistema de escrow com Stripe será implementado na próxima fase. Os valores dos contratos ficarão retidos até conclusão."
        />
      </Card>
    </div>
  )
}

export function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-syne font-black text-2xl">Perfil</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">Edita as tuas informações</p>
      </div>
      <Card>
        <EmptyState
          icon={<User size={24} className="text-[var(--muted)]" />}
          title="Edição de perfil — Fase 5"
          description="A edição completa do perfil — foto, descrição, portfólio — será entregue na próxima fase."
        />
      </Card>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-syne font-black text-2xl">Definições</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">Configurações da conta</p>
      </div>
      <Card>
        <EmptyState
          icon={<Settings size={24} className="text-[var(--muted)]" />}
          title="Definições — Fase 5"
          description="Alteração de email, password, notificações e modo claro/escuro ficarão disponíveis na próxima fase."
        />
      </Card>
    </div>
  )
}
