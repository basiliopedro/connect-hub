import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { chatService } from '@/services/chatService'
import { useToast } from '@/components/ui/Toast'
import { Avatar, EmptyState } from '@/components/ui'
import { Send, MessageSquare, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { format, isToday, isYesterday } from 'date-fns'
import { pt } from 'date-fns/locale'

// ── Formata timestamp da mensagem ────────────────────────────
function formatMsgTime(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ontem ' + format(d, 'HH:mm')
  return format(d, 'dd MMM HH:mm', { locale: pt })
}

// ── Separador de data no chat ────────────────────────────────
function DateSeparator({ date }) {
  const d = new Date(date)
  const label = isToday(d)     ? 'Hoje'
              : isYesterday(d) ? 'Ontem'
              : format(d, 'dd MMMM yyyy', { locale: pt })
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-xs text-[var(--muted)] px-2">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

// ── Bolha de mensagem ────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  return (
    <div className={clsx('flex gap-2.5 items-end max-w-[78%]', isOwn && 'ml-auto flex-row-reverse')}>
      {!isOwn && (
        <Avatar
          src={msg.sender?.avatar_url}
          name={`${msg.sender?.nome}`}
          size="sm"
        />
      )}
      <div className={clsx(
        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
        isOwn
          ? 'bg-gradient-to-br from-accent to-accent-2 text-white rounded-br-sm'
          : 'bg-[var(--surface2)] text-[var(--text)] rounded-bl-sm'
      )}>
        <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
        <p className={clsx(
          'text-[10px] mt-1 text-right',
          isOwn ? 'text-white/60' : 'text-[var(--muted)]'
        )}>
          {formatMsgTime(msg.created_at)}
          {isOwn && (
            <span className="ml-1">{msg.lida ? '✓✓' : '✓'}</span>
          )}
        </p>
      </div>
    </div>
  )
}

// ── Painel da conversa ────────────────────────────────────────
function ConversationPanel({ conversation, userId, onBack }) {
  const { show }           = useToast()
  const [msgs, setMsgs]    = useState([])
  const [text, setText]    = useState('')
  const [loading, setLoad] = useState(true)
  const [sending, setSend] = useState(false)
  const bottomRef          = useRef()
  const inputRef           = useRef()
  const contractId         = conversation.id

  // Scroll para o fundo
  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // Carregar mensagens iniciais
  useEffect(() => {
    const load = async () => {
      setLoad(true)
      try {
        const data = await chatService.getMessages(contractId)
        setMsgs(data)
        scrollBottom()
        await chatService.markAsRead(contractId)
      } catch (err) {
        show(err.message, 'error')
      } finally {
        setLoad(false)
      }
    }
    load()
  }, [contractId, show])

  // Subscrição em tempo real
  useEffect(() => {
    const unsub = chatService.subscribeToMessages(contractId, (newMsg) => {
      setMsgs(prev => {
        // Evitar duplicados
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      scrollBottom()
      // Marcar como lida se não for nossa
      if (newMsg.sender_id !== userId) {
        chatService.markAsRead(contractId)
      }
    })
    return unsub
  }, [contractId, userId])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSend(true)
    setText('')
    try {
      const msg = await chatService.sendMessage(contractId, trimmed)
      // A mensagem pode chegar pelo realtime ou adicionar directamente
      setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      scrollBottom()
    } catch (err) {
      setText(trimmed) // Restaurar texto em caso de erro
      show(err.message, 'error')
    } finally {
      setSend(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Agrupar mensagens por dia
  const grouped = msgs.reduce((acc, msg) => {
    const day = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  const other = conversation.otherParty

  return (
    <div className="flex flex-col h-full">
      {/* Header da conversa */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] mr-1"
          >
            ←
          </button>
        )}
        <Avatar src={other?.avatar_url} name={`${other?.nome}`} size="md" />
        <div>
          <div className="font-semibold text-sm">{other?.nome} {other?.apelido}</div>
          <div className="text-xs text-[var(--muted)] truncate max-w-[200px]">
            {conversation.project?.titulo}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center flex-1 gap-2 text-[var(--muted)]">
            <Loader2 size={18} className="animate-spin" /> A carregar...
          </div>
        ) : !msgs.length ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
            <MessageSquare size={32} className="text-[var(--muted)] opacity-30" />
            <p className="text-[var(--muted)] text-sm">
              Ainda sem mensagens.<br />Envia a primeira mensagem para começar.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayMsgs]) => (
            <div key={day}>
              <DateSeparator date={day} />
              <div className="flex flex-col gap-2">
                {dayMsgs.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.sender_id === userId}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de mensagem */}
      <div className="px-4 py-3 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex items-end gap-2 bg-[var(--surface2)] border border-[var(--border2)]
          rounded-2xl px-4 py-2.5 focus-within:border-accent transition-colors">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escreve uma mensagem... (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm
              text-[var(--text)] placeholder:text-[var(--muted)]
              max-h-[120px] min-h-[24px]"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={clsx(
              'p-2 rounded-xl transition-all flex-shrink-0',
              text.trim() && !sending
                ? 'bg-accent text-white hover:bg-accent/90 shadow-[0_0_12px_rgba(124,92,252,0.4)]'
                : 'text-[var(--muted)] cursor-not-allowed'
            )}
          >
            {sending
              ? <Loader2 size={17} className="animate-spin" />
              : <Send size={17} />
            }
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-1.5 text-center opacity-60">
          Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}

// ── Item da lista de conversas ────────────────────────────────
function ConversationItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-[var(--border)] last:border-0',
        isActive
          ? 'bg-accent/8 border-l-2 border-l-accent'
          : 'hover:bg-[var(--surface2)]'
      )}
    >
      <Avatar
        src={conv.otherParty?.avatar_url}
        name={conv.otherParty?.nome}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-semibold text-sm truncate">
            {conv.otherParty?.nome} {conv.otherParty?.apelido}
          </span>
          {conv.lastMessage && (
            <span className="text-[10px] text-[var(--muted)] flex-shrink-0 ml-2">
              {formatMsgTime(conv.lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--muted)] truncate">
            {conv.lastMessage
              ? conv.lastMessage.conteudo
              : conv.project?.titulo
            }
          </p>
          {conv.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-white
              text-[10px] font-bold flex items-center justify-center">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function ChatPage() {
  const { profile }               = useAuth()
  const [searchParams]            = useSearchParams()
  const { show }                  = useToast()
  const [conversations, setConvs] = useState([])
  const [active, setActive]       = useState(null)
  const [loadingConvs, setLoadC]  = useState(true)
  const [mobileView, setMobile]   = useState('list') // 'list' | 'chat'

  const load = useCallback(async () => {
    setLoadC(true)
    try {
      const data = await chatService.getConversations()
      setConvs(data)

      // Seleccionar conversa por query param (?contract=...)
      const contractParam = searchParams.get('contract')
      if (contractParam) {
        const found = data.find(c => c.id === contractParam)
        if (found) { setActive(found); setMobile('chat') }
      }
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoadC(false)
    }
  }, [searchParams, show])

  useEffect(() => { load() }, [load])

  const handleSelectConv = (conv) => {
    setActive(conv)
    setMobile('chat')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Título — apenas desktop */}
      <div className="hidden lg:block">
        <h1 className="font-syne font-black text-2xl">Mensagens</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          Chat em tempo real com clientes e profissionais
        </p>
      </div>

      {/* Container do chat */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px]
        overflow-hidden flex h-[calc(100vh-220px)] min-h-[400px]">

        {/* ── Lista de conversas ── */}
        <div className={clsx(
          'flex flex-col border-r border-[var(--border)] flex-shrink-0',
          'w-full lg:w-[300px]',
          // Mobile: oculta se estiver na vista de chat
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        )}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-syne font-bold text-base">Conversas</h2>
            {conversations.length > 0 && (
              <p className="text-xs text-[var(--muted)]">
                {conversations.length} activa{conversations.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-10 gap-2 text-[var(--muted)]">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : !conversations.length ? (
              <EmptyState
                icon={<MessageSquare size={22} className="text-[var(--muted)]" />}
                title="Sem conversas"
                description="As conversas começam quando um contrato é criado."
              />
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={active?.id === conv.id}
                  onClick={() => handleSelectConv(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Painel de mensagens ── */}
        <div className={clsx(
          'flex-1 flex flex-col',
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        )}>
          {active ? (
            <ConversationPanel
              key={active.id}
              conversation={active}
              userId={profile?.id}
              onBack={() => setMobile('list')}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <MessageSquare size={40} className="text-[var(--muted)] opacity-20" />
              <p className="text-[var(--muted)] text-sm">
                Selecciona uma conversa para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
