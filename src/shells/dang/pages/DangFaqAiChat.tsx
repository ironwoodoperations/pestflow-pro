import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are a helpful pest control assistant for Dang Pest Control in Tyler, Texas (East Texas / Piney Woods region). You specialize in pests common to East Texas: ants (especially fire ants), roaches, mosquitoes, wasps, scorpions, rodents, spiders, fleas, ticks, and bed bugs. Answer questions helpfully and concisely. Always recommend professional treatment for serious infestations. When relevant, mention that Dang Pest Control offers free estimates at (903) 871-0550. Keep answers friendly and conversational. Do not answer questions unrelated to pest control.`

interface Props {
  onClose: () => void
}

export default function DangFaqAiChat({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data?.content?.[0]?.text || 'Sorry, I had trouble with that. Please call us at (903) 871-0550.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please call us at (903) 871-0550.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998 }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0, zIndex: 999,
        width: 'min(420px, 100vw)',
        height: 'clamp(320px, 60vh, 560px)',
        background: '#fff',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Open Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#F97316',
          borderRadius: '16px 16px 0 0',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>🤖 Dang AI Assistant</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>Ask me anything about pests</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >Clear chat</button>
            )}
            <button
              onClick={onClose}
              style={{ fontSize: '20px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
              aria-label="Close"
            >×</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🐛</div>
              <p style={{ margin: 0 }}>Ask me about ants, roaches, mosquitoes,<br />wasps, or any pest problem in East Texas.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? '#F97316' : '#f3f4f6',
              color: m.role === 'user' ? '#fff' : '#1a1a1a',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '9px 13px',
              fontSize: '13px',
              lineHeight: 1.55,
            }}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start', background: '#f3f4f6', borderRadius: '12px 12px 12px 2px',
              padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#F97316',
                  animation: `bounce 0.9s ease-in-out ${i * 0.15}s infinite alternate`,
                }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your pest question..."
            style={{
              flex: 1, padding: '9px 13px', border: '1.5px solid #e5e7eb', borderRadius: '8px',
              fontSize: '13px', outline: 'none', fontFamily: "'Open Sans', sans-serif",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              padding: '9px 14px', background: input.trim() && !loading ? '#F97316' : '#e5e7eb',
              color: input.trim() && !loading ? '#fff' : '#999',
              border: 'none', borderRadius: '8px', cursor: input.trim() && !loading ? 'pointer' : 'default',
              fontSize: '13px', fontWeight: 600, transition: 'background 0.15s',
            }}
          >Send</button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); opacity: 0.5; }
          to   { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
