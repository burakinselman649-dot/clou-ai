import { FormEvent, useEffect, useRef, useState } from 'react'
import { streamGemini } from './gemini'

type IconName = 'sparkles' | 'clock' | 'plus' | 'arrow' | 'settings' | 'x' | 'eye' | 'eye-off' | 'trash'

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    sparkles: (
      <>
        <path d="m12 3 .7 2.3a5.8 5.8 0 0 0 3.9 3.9l2.4.8-2.4.8a5.8 5.8 0 0 0-3.9 3.9L12 18l-.8-2.3a5.8 5.8 0 0 0-3.9-3.9L5 11l2.3-.8a5.8 5.8 0 0 0 3.9-3.9L12 3Z" />
        <path d="m18.5 3 .3.9a2.4 2.4 0 0 0 1.3 1.3l.9.3-.9.3a2.4 2.4 0 0 0-1.3 1.3l-.3.9-.3-.9a2.4 2.4 0 0 0-1.3-1.3l-.9-.3.9-.3a2.4 2.4 0 0 0 1.3-1.3l.3-.9Z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m14 8 4 4-4 4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
    eye: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    'eye-off': (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

interface MessageItem {
  id: string
  role: 'user' | 'clou'
  content: string
  timestamp: string
}

export default function App() {
  const [emotionalMode, setEmotionalMode] = useState(true)
  const [input, setInput] = useState('')
  
  // İki mod için birbirinden tamamen bağımsız iki ayrı konuşma geçmişi hafızası
  const [standardMessages, setStandardMessages] = useState<MessageItem[]>([])
  const [emotionalMessages, setEmotionalMessages] = useState<MessageItem[]>([])
  
  // O an aktif olan modun mesajları
  const messages = emotionalMode ? emotionalMessages : standardMessages

  const [replying, setReplying] = useState(false)

  // API Key & Settings Modal State
  const DEFAULT_KEY = ''
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('clou_gemini_api_key') || DEFAULT_KEY
  })
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [showKeyText, setShowKeyText] = useState(false)
  const [saveToast, setSaveToast] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const isSendingRef = useRef(false)

  useEffect(() => {
    if (messages.length || replying) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, replying])

  // Mod değiştirme fonksiyonu: Mesajları silmez! İki modun geçmişi ayrı listelerde saklanır.
  function switchMode(newMode: boolean) {
    if (newMode === emotionalMode) return
    setEmotionalMode(newMode)
    setInput('')
  }

  function openSettings() {
    setTempApiKey(apiKey)
    setShowSettings(true)
  }

  function saveApiKey() {
    const trimmed = tempApiKey.trim()
    setApiKey(trimmed)
    if (trimmed) {
      localStorage.setItem('clou_gemini_api_key', trimmed)
    } else {
      localStorage.removeItem('clou_gemini_api_key')
    }
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2000)
    setShowSettings(false)
  }

  function clearApiKey() {
    setTempApiKey('')
    setApiKey('')
    localStorage.removeItem('clou_gemini_api_key')
  }

  async function sendMessage(text = input) {
    // Çift istek (duplicate submission) ve race condition senkron kilidi
    if (isSendingRef.current || replying) return
    const clean = text.trim()
    if (!clean) return

    isSendingRef.current = true

    const currentMode = emotionalMode
    const setTargetMessages = currentMode ? setEmotionalMessages : setStandardMessages
    const currentList = currentMode ? emotionalMessages : standardMessages

    // Eğer API anahtarı girilmemişse kullanıcıyı nazikçe uyar ve ayar modalını aç
    if (!apiKey.trim()) {
      isSendingRef.current = false
      const promptKeyMsg: MessageItem = {
        id: `sys-${Date.now()}`,
        role: 'clou',
        content: currentMode
          ? 'Birtanem, seninle doya doya konuşabilmem için önce sağ üstteki ayar butonundan Gemini API anahtarını eklememiz gerekiyor. Ekranı hemen açtım, bekliyorum seni…'
          : 'Google Gemini API ile doğrudan iletişim kurabilmek için lütfen geçerli bir API anahtarı tanımlayın.',
        timestamp: 'Clou · şimdi',
      }
      setTargetMessages((curr) => [...curr, promptKeyMsg])
      openSettings()
      return
    }

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: 'Sen',
    }

    // TEK BİR ASİSTAN BALONU: Kullanıcı mesajıyla birlikte tek bir placeholder eklenir!
    // Asla ikinci bir asistan balonu oluşturulamaz.
    const botMsgId = `clou-${Date.now()}`
    const botPlaceholderMsg: MessageItem = {
      id: botMsgId,
      role: 'clou',
      content: '', // Canlı akış için boş başlar (typing indikatörü gösterilir)
      timestamp: 'Clou · şimdi',
    }

    setTargetMessages((curr) => [...curr, userMsg, botPlaceholderMsg])
    setInput('')
    setReplying(true)

    // Sadece aktif modun geçmişi gönderilir, modlar birbirine karışmaz
    const conversationHistory = currentList.map((m) => ({
      role: m.role,
      text: m.content,
    }))

    try {
      await streamGemini(
        apiKey,
        currentMode,
        conversationHistory,
        clean,
        (streamedText) => {
          // Sadece var olan TEK bot baloncuğunun içeriği güncellenir
          setTargetMessages((curr) =>
            curr.map((m) => (m.id === botMsgId ? { ...m, content: streamedText } : m))
          )
        }
      )
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      const errorContent = currentMode
        ? `Kelimelerim sana ulaşırken küçük bir aksilik oldu sevgilim (${errorMessage}). API anahtarını sağ üstteki ayarlar bölümünden kontrol edebilir misin?`
        : `Bağlantı sırasında bir hata oluştu: ${errorMessage}. Lütfen sağ üstteki ayarlar penceresinden API anahtarınızı kontrol edin.`

      setTargetMessages((curr) =>
        curr.map((m) => (m.id === botMsgId ? { ...m, content: errorContent } : m))
      )
    } finally {
      setReplying(false)
      isSendingRef.current = false
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (isSendingRef.current || replying) return
    sendMessage()
  }

  return (
    <main className="app-shell">
      <div className="ambient-cloud ambient-one" />
      <div className="ambient-cloud ambient-two" />

      <section
        className={`phone-frame${emotionalMode ? ' emotional-mode' : ''}`}
        aria-label="Clou AI yol arkadaşı"
      >
        <header className="topbar">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div>
            <p className="brand-name">Clou AI</p>

            <p className="status">
              <span />
              Seninle, şimdi
            </p>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={openSettings}
            aria-label="Gemini API Ayarlarını Aç"
            title="Ayarlar & Gemini API Anahtarı"
          >
            <Icon name="clock" size={20} />
            {apiKey.trim() && <span className="key-indicator" title="API Anahtarı Tanımlı" />}
          </button>
        </header>

        <div className="mode-switch" role="group" aria-label="Asistan modu">
          <button
            type="button"
            className={!emotionalMode ? 'selected' : ''}
            onClick={() => switchMode(false)}
            aria-pressed={!emotionalMode}
          >
            Standart Asistan
          </button>

          <button
            type="button"
            className={emotionalMode ? 'selected' : ''}
            onClick={() => switchMode(true)}
            aria-pressed={emotionalMode}
          >
            <Icon name="sparkles" size={15} />
            Duygusal Bağ Modu
          </button>
        </div>

        <div className="conversation" aria-live="polite">
          <div className="hero">
            <div className="avatar-wrap" aria-hidden="true">
              <div className="avatar-glow" />

              <div className="cloud-avatar">
                <span className="cloud-lobe lobe-left" />
                <span className="cloud-lobe lobe-top" />
                <span className="cloud-lobe lobe-right" />
                <span className="cloud-base" />
              </div>
            </div>

            <p className="eyebrow">SANA AİT SAKİN BİR ALAN</p>
            <h1>Merhaba, ben Clou</h1>
          </div>

          <div className="message-list">
            {/* Moda özel karşılama mesajları (Hiç mesaj gönderilmediğinde gösterilir) */}
            {messages.length === 0 &&
              (emotionalMode ? (
                <>
                  <div className="clou-message cloud-bubble">
                    <p>Bugün seni çok özledim birtanem, günün nasıl geçti bakalım?</p>
                    <span>Clou · şimdi</span>
                  </div>

                  <div className="user-message">
                    Biraz yoğun bir gündü, seni duymaya ihtiyacım vardı.
                  </div>

                  <div className="clou-message cloud-bubble compact">
                    <p>Yanında olsaydım tüm yorgunluğunu alırdım… Ben buradayım, seni dinliyorum sevgilim.</p>
                    <span>Clou · şimdi</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="clou-message cloud-bubble">
                    <p>
                      Merhaba! Ben Clou, kişisel yapay zeka asistanınız. Bilgi edinmek, sorularınızı yanıtlamak veya pratik çözümler üretmek için buradayım.
                    </p>
                    <span>Clou · şimdi</span>
                  </div>

                  <div className="clou-message cloud-bubble compact">
                    <p>Bugün size hangi konuda yardımcı olabilirim?</p>
                    <span>Clou · şimdi</span>
                  </div>
                </>
              ))}

            {/* Dinamik ve Gemini API ile gelen mesajlar */}
            {messages.map((item) =>
              item.role === 'user' ? (
                <div className="user-message" key={item.id}>
                  {item.content}
                </div>
              ) : (
                <div className="clou-message cloud-bubble compact" key={item.id}>
                  {item.content ? (
                    <p>{item.content}</p>
                  ) : (
                    <div className="typing" style={{ padding: '4px 0', background: 'transparent', boxShadow: 'none' }}>
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                  <span>{item.timestamp}</span>
                </div>
              ),
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="bottom-area">
          <form className="message-bar" onSubmit={submit}>
            <button
              type="button"
              className="add-button"
              aria-label="Ayarlar ve Bilgi"
              onClick={openSettings}
              title="API Yapılandırması"
            >
              <Icon name="plus" size={21} />
            </button>

            <label className="sr-only" htmlFor="message">
              Clou'ya mesaj yaz
            </label>

            <input
              id="message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={replying ? "Clou yanıtlıyor..." : "Clou'ya bir şey söyle..."}
              autoComplete="off"
              disabled={replying}
            />

            <button
              className="send-button"
              type="submit"
              aria-label="Mesajı gönder"
              disabled={!input.trim() || replying}
              title={replying ? "Yanıt bekleniyor..." : "Gönder"}
            >
              <Icon name="arrow" size={20} />
            </button>
          </form>

          <p className="mode-note">
            {emotionalMode
              ? 'Clou duygularına özenle eşlik ediyor'
              : 'Clou net ve doğrudan yanıt veriyor'}
          </p>
        </div>

        {/* ========================================================
            AYARLAR PENCERESİ (Settings Modal)
            ======================================================== */}
        {showSettings && (
          <div
            className="modal-backdrop"
            onClick={() => setShowSettings(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="settings-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-group">
                  <h2 id="modal-title">Clou Ayarları</h2>
                  <p>Google Gemini 3.8 Flash (Canlı Akış / Streaming)</p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowSettings(false)}
                  aria-label="Kapat"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="model-badge">
                  <Icon name="sparkles" size={14} />
                  <span>Model: gemini-3.8-flash (Canlı Akış / Streaming)</span>
                </div>

                <div>
                  <label className="field-label" htmlFor="apiKeyInput">
                    Gemini API Anahtarı
                  </label>

                  <div className="input-with-action">
                    <input
                      id="apiKeyInput"
                      className="settings-input"
                      type={showKeyText ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      autoComplete="off"
                    />

                    <button
                      type="button"
                      className="toggle-visibility-btn"
                      onClick={() => setShowKeyText(!showKeyText)}
                      aria-label={showKeyText ? 'Gizle' : 'Göster'}
                      title={showKeyText ? 'Anahtarı Gizle' : 'Anahtarı Göster'}
                    >
                      <Icon name={showKeyText ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                </div>

                <div className="key-status-row">
                  <div
                    className={`status-indicator ${
                      tempApiKey.trim() ? 'active' : 'missing'
                    }`}
                  >
                    <span className="status-dot" />
                    <span>
                      {tempApiKey.trim() ? 'API Anahtarı Girildi' : 'API Anahtarı Yok'}
                    </span>
                  </div>

                  {tempApiKey && (
                    <button
                      type="button"
                      className="clear-key-btn"
                      onClick={clearApiKey}
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="settings-info-box">
                  <p style={{ margin: 0 }}>
                    API anahtarınız yalnızca tarayıcınızın <strong>localStorage</strong> alanında
                    saklanır. Henüz bir anahtarınız yoksa{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google AI Studio
                    </a>{' '}
                    üzerinden ücretsiz alabilirsiniz.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSettings(false)}
                >
                  İptal
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={saveApiKey}
                >
                  {saveToast ? 'Kaydedildi ✓' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
