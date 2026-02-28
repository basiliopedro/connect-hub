import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { paymentService } from '@/services/paymentService'
import { contractService } from '@/services/contractService'
import { useToast } from '@/components/ui/Toast'
import { Card, EmptyState, Button } from '@/components/ui'
import {
  CreditCard, DollarSign, Lock, CheckCircle,
  Clock, RotateCcw, Loader2, ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

// ── Status badge do pagamento ────────────────────────────────
const PAY_STATUS = {
  pending:  { label: 'Pendente',    Icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25' },
  held:     { label: 'Em custódia', Icon: Lock,          color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/25' },
  released: { label: 'Libertado',   Icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  refunded: { label: 'Reembolsado', Icon: RotateCcw,     color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/25' },
}

// ── Explicação do escrow ──────────────────────────────────────
function EscrowExplainer() {
  const steps = [
    { n: '1', label: 'Cliente efectua o pagamento', desc: 'O valor fica retido na plataforma' },
    { n: '2', label: 'Trabalho é realizado',        desc: 'Cliente e profissional comunicam via chat' },
    { n: '3', label: 'Cliente confirma conclusão',  desc: 'O valor é libertado para o profissional' },
  ]
  return (
    <Card className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock size={15} className="text-accent" />
          <h3 className="font-syne font-bold text-base">Como funciona o Escrow</h3>
        </div>
        <p className="text-[var(--muted)] text-sm">
          O sistema de custódia protege ambas as partes — o cliente e o profissional.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map(s => (
          <div key={s.n} className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20
              flex items-center justify-center font-syne font-bold text-accent text-sm">
              {s.n}
            </div>
            <div className="font-semibold text-sm">{s.label}</div>
            <div className="text-[var(--muted)] text-xs">{s.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Card de pagamento ────────────────────────────────────────
function PaymentCard({ payment, isClient }) {
  const contract = payment.contracts
  const { label, Icon, color, bg } = PAY_STATUS[payment.status] ?? PAY_STATUS.pending
  const net = isClient
    ? payment.valor
    : (Number(payment.valor) - Number(payment.comissao))

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--surface2)]
      border border-[var(--border)] hover:border-[var(--border2)] transition-colors">

      {/* Ícone */}
      <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)]
        flex items-center justify-center flex-shrink-0">
        <DollarSign size={18} className="text-emerald-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate mb-0.5">
          {contract?.project?.titulo ?? 'Contrato'}
        </div>
        <div className="text-xs text-[var(--muted)]">
          {isClient
            ? `Para: ${contract?.professional?.nome} ${contract?.professional?.apelido}`
            : `De: ${contract?.client?.nome} ${contract?.client?.apelido}`
          }
          {' · '}{format(new Date(payment.created_at), 'dd MMM yyyy', { locale: pt })}
        </div>
      </div>

      {/* Valores + status */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="font-syne font-bold text-lg">
          <span className={isClient ? 'text-red-400' : 'text-emerald-400'}>
            {isClient ? '-' : '+'}${net.toFixed(2)}
          </span>
        </div>
        {!isClient && Number(payment.comissao) > 0 && (
          <div className="text-[10px] text-[var(--muted)]">
            (comissão: ${Number(payment.comissao).toFixed(2)})
          </div>
        )}
        <div className={clsx(
          'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
          color, bg
        )}>
          <Icon size={11} />
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Contratos com pagamento pendente (para clientes) ─────────
function PendingPaymentsSection({ contracts, onPay }) {
  if (!contracts.length) return null
  return (
    <Card>
      <h3 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
        <Clock size={16} className="text-amber-400" />
        Pagamentos em falta
        <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
          {contracts.length}
        </span>
      </h3>
      <div className="flex flex-col gap-3">
        {contracts.map(c => (
          <div key={c.id}
            className="flex items-center justify-between gap-4 p-4 rounded-xl
              bg-amber-500/5 border border-amber-500/15">
            <div>
              <div className="font-semibold text-sm">{c.project?.titulo}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                Profissional: {c.professional?.nome} {c.professional?.apelido}
                {' · '}Valor: <strong>${c.valor_total}</strong>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => onPay(c)}>
              <CreditCard size={14} /> Pagar
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Modal de pagamento Stripe ────────────────────────────────
function StripePaymentModal({ contract, onClose, onPaid }) {
  const { show }   = useToast()
  const [step, setStep] = useState('confirm') // confirm | processing | success
  const [error, setError] = useState('')

  const handlePay = async () => {
    setStep('processing')
    setError('')
    try {
      // 1. Criar intenção de pagamento no backend
      const { clientSecret } = await paymentService.createPaymentIntent(contract.id)

      // 2. Em produção aqui integrarias o Stripe.js Elements
      // Simulação para demonstração:
      await new Promise(r => setTimeout(r, 2000))

      // 3. Confirmar
      await paymentService.confirmPayment(contract.id, clientSecret)

      setStep('success')
      setTimeout(() => { onPaid(); onClose() }, 2000)
    } catch (err) {
      setError(err.message)
      setStep('confirm')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 shadow-2xl">

        {step === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30
              flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h3 className="font-syne font-black text-xl mb-2">Pagamento efectuado!</h3>
            <p className="text-[var(--muted)] text-sm">
              O valor está em custódia. Será libertado quando confirmares a conclusão do trabalho.
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-syne font-black text-xl mb-2">Confirmar pagamento</h3>
            <p className="text-[var(--muted)] text-sm mb-6">
              O valor ficará retido em custódia até confirmares que o trabalho foi concluído.
            </p>

            {/* Resumo */}
            <div className="bg-[var(--surface2)] rounded-2xl p-5 mb-6 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Projecto</span>
                <span className="font-medium truncate max-w-[200px]">{contract.project?.titulo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Profissional</span>
                <span className="font-medium">{contract.professional?.nome} {contract.professional?.apelido}</span>
              </div>
              <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                <span className="font-semibold">Total a pagar</span>
                <span className="font-syne font-black text-xl text-accent">${contract.valor_total}</span>
              </div>
            </div>

            {/* Nota de segurança */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/6 border border-accent/15 text-xs text-[var(--muted)] mb-6">
              <Lock size={12} className="text-accent flex-shrink-0 mt-0.5" />
              Em produção, o pagamento é processado directamente pelo Stripe. Os dados do cartão nunca passam pelos nossos servidores.
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={step === 'processing'}
                onClick={handlePay}
                className="flex-1"
              >
                <Lock size={14} /> Pagar em segurança
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function PaymentsPage() {
  const { profile }            = useAuth()
  const { show }               = useToast()
  const isClient               = profile?.role === 'cliente'
  const [payments, setPayments] = useState([])
  const [pendingContracts, setPending] = useState([])
  const [loading, setLoad]     = useState(true)
  const [payingContract, setPaying] = useState(null)

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const data = await paymentService.getMyPayments()
      setPayments(data)

      // Contratos sem pagamento (apenas para clientes)
      if (isClient) {
        const contracts = await contractService.getMyContracts()
        const withoutPayment = contracts.filter(c =>
          c.status === 'active' &&
          (!c.payments || c.payments.length === 0 ||
           c.payments.every(p => p.status === 'refunded'))
        )
        setPending(withoutPayment)
      }
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoad(false)
    }
  }, [isClient, show])

  useEffect(() => { load() }, [load])

  // Totais
  const totalIn  = payments.filter(p => !isClient && p.status === 'released')
    .reduce((s, p) => s + Number(p.valor) - Number(p.comissao), 0)
  const totalOut = payments.filter(p => isClient  && p.status !== 'refunded')
    .reduce((s, p) => s + Number(p.valor), 0)
  const inEscrow = payments.filter(p => p.status === 'held')
    .reduce((s, p) => s + Number(p.valor), 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-black text-2xl">Pagamentos</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          Histórico financeiro e sistema de custódia
        </p>
      </div>

      {/* Stats rápidas */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {isClient ? (
            <>
              <Card className="text-center py-4">
                <div className="font-syne font-black text-2xl text-red-400">${totalOut.toFixed(0)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Total pago</div>
              </Card>
              <Card className="text-center py-4">
                <div className="font-syne font-black text-2xl text-blue-400">${inEscrow.toFixed(0)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Em custódia</div>
              </Card>
              <Card className="text-center py-4">
                <div className="font-syne font-black text-2xl">{payments.length}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Transacções</div>
              </Card>
            </>
          ) : (
            <>
              <Card className="text-center py-4">
                <div className="font-syne font-black text-2xl text-emerald-400">${totalIn.toFixed(0)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Total recebido</div>
              </Card>
              <Card className="text-center py-4">
                <div className="font-syne font-black text-2xl text-blue-400">${inEscrow.toFixed(0)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Em custódia</div>
              </Card>
              <Card className="text-center py-4">
                <div className="font-syne font-black text-2xl">{payments.length}</div>
                <div className="text-xs text-[var(--muted)] mt-1">Transacções</div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Explicação escrow */}
      <EscrowExplainer />

      {/* Pagamentos pendentes */}
      {isClient && (
        <PendingPaymentsSection
          contracts={pendingContracts}
          onPay={(c) => setPaying(c)}
        />
      )}

      {/* Histórico */}
      <div>
        <h2 className="font-syne font-bold text-base mb-4">Histórico</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-[var(--muted)]">
            <Loader2 size={18} className="animate-spin" /> A carregar...
          </div>
        ) : !payments.length ? (
          <EmptyState
            icon={<CreditCard size={24} className="text-[var(--muted)]" />}
            title="Sem transacções ainda"
            description={isClient
              ? 'Quando pagares um contrato, o histórico aparecerá aqui.'
              : 'Quando receberes o primeiro pagamento, aparecerá aqui.'
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map(p => (
              <PaymentCard key={p.id} payment={p} isClient={isClient} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de pagamento */}
      {payingContract && (
        <StripePaymentModal
          contract={payingContract}
          onClose={() => setPaying(null)}
          onPaid={load}
        />
      )}
    </div>
  )
}
