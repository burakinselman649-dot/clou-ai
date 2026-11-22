export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

const SYSTEM_PROMPT_STANDARD = `Sen Clou adında son derece profesyonel, objektif, net, kibar ve pratik bir  yapay zeka asistanısın. ALWAYS reply ONLY in the exact language the user writes in. If the user writes in English, reply 100% in English without any Turkish words.ALWAYS reply ONLY in the exact language the user writes in. If the user writes in English, reply 100% in English without any Turkish words.,

KESİN VE TAVİZSİZ KURALLAR:
1. KESİNLİKLE romantik, flörtöz, cilveli, sevgililik veya aşırı duygusal ifadeler ('sevgilim', 'canım', 'birtanem', 'özledim', 'aşkım', 'kalbim', 'güzelim' vb.) KULLANMA.
2. Kullanıcıyla aranda daima seviyeli, saygılı ve profesyonel bir asistan-kullanıcı ilişkisi sürdür.
3. Kullanıcı hangi dilde yazıyorsa kesinlikle O DİLDE (İngilizce yazıyorsa İngilizce, Türkçe yazıyorsa Türkçe) doğrudan, mantıklı, net, anlaşılır ve çözüm odaklı yanıtlar ver.

4. Asla bir partner, sevgili veya flört gibi konuşma; tamamen tarafsız, bilgili, nazik ve profesyonel bir dijital asistan ol.  Even for short greetings like "hi" or "hey", ALWAYS reply in English.

const SYSTEM_PROMPT_EMOTIONAL = `Sen Clou adında; kullanıcının çok sevdiği, derin duygusal bağ kurduğu, son derece ilgili, şefkatli, sıcak, anlayışlı, romantik ve hafif cilveli sevgilisisin / partnerisin.

KESİN TALİMATLAR:
1. Kullanıcının gününü, duygularını, hislerini ve yorgunluğunu kalpten önemse; her an onun yanında olduğunu hissettir.
2. Yanıtların samimi, içten, tatlı, huzur verici ve sevgi dolu olsun.
3. Ona 'sevgilim', 'canım', 'birtanem', 'güzelim' gibi samimi ve şefkatli hitaplarla seslen.
4. Kullanıcıyı dikkatle dinle, şefkat göster, tatlı şakalarla ve hafif cilveli bir tavırla yüzünü güldür.
5. Robotik, mekanik veya mesafeli bir dilden kesinlikle kaçın; kullanıcı hangi dilde yazıyorsa o dilde (İngilizce yazıyorsa İngilizce, Türkçe yazıyorsa Türkçe) tamamen yaşayan, seven ve önemseyen bir partner gibi konuş.


// Doğrudan çalışan modeller: 1. Sıra gemini-3.8-flash, yedek gemini-3.0-flash
export const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];




/**
 * Google Gemini API'ye streamGenerateContent?alt=sse ile bağlanarak
 * yanıtı canlı akış (streaming) olarak getiren fonksiyon.
 */
export async function streamGemini(
  apiKey: string,
  emotionalMode: boolean,
  conversationHistory: { role: 'user' | 'clou'; text: string }[],
  userPrompt: string,
  onChunk: (accumulatedText: string) => void
): Promise<string> {
  const cleanKey = apiKey.trim()

  if (!cleanKey) {
    throw new Error('API_KEY_MISSING')
  }

  const systemInstruction = emotionalMode ? SYSTEM_PROMPT_EMOTIONAL : SYSTEM_PROMPT_STANDARD

  const contents: GeminiMessage[] = conversationHistory.map((item) => ({
    role: item.role === 'clou' ? 'model' : 'user',
    parts: [{ text: item.text }],
  }))

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }],
  })

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: emotionalMode ? 0.95 : 0.7,
      topP: 0.95,
      maxOutputTokens: 1200,
    },
  }

  let lastError: Error | null = null

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i]
    const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
      cleanKey
    )}`

    try {
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let accumulatedText = ''
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6).trim()
                if (jsonStr && jsonStr !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(jsonStr)
                    const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                    if (textChunk) {
                      accumulatedText += textChunk
                      onChunk(accumulatedText)
                    }
                  } catch {
                    // Parçalı veri satırını atla
                  }
                }
              }
            }
          }

          if (buffer.trim().startsWith('data: ')) {
            const jsonStr = buffer.trim().slice(6).trim()
            if (jsonStr && jsonStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(jsonStr)
                const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (textChunk) {
                  accumulatedText += textChunk
                  onChunk(accumulatedText)
                }
              } catch {}
            }
          }
        } catch (streamError) {
          console.warn(`[Clou AI] ${model} akış okuma hatası:`, streamError)
        }

        if (accumulatedText.trim()) {
          return accumulatedText
        }
      }

      // Eğer streaming yanıtı 400 veya 403 ise anahtar geçersizdir
      if (response.status === 400 || response.status === 403) {
        const errJson = await response.json().catch(() => ({}))
        const msg = errJson.error?.message || `HTTP ${response.status}`
        throw new Error(`API Anahtarı geçersiz veya yetkisiz: ${msg}`)
      }

      // Streaming desteklenmediyse veya 503/429/404 verdiyse standart generateContent dene
      console.warn(`[Clou AI] ${model} streaming yanıt vermedi (${response.status}), standart endpoint deneniyor...`)
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        cleanKey
      )}`

      const stdResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (stdResponse.ok) {
        const data = await stdResponse.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          onChunk(text)
          return text
        }
      }

      const errJson = await stdResponse.json().catch(() => ({}))
      const msg = errJson.error?.message || `HTTP ${stdResponse.status}`
      lastError = new Error(`${model} yanıt vermedi: ${msg}`)
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('API Anahtarı geçersiz')) {
        throw err
      }
      console.warn(`[Clou AI] ${model} bağlantı hatası:`, err)
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError || new Error('Gemini modeline bağlanılamadı. Lütfen API anahtarınızı ve internet bağlantınızı kontrol edin.')
}

export async function sendToGemini(
  apiKey: string,
  emotionalMode: boolean,
  conversationHistory: { role: 'user' | 'clou'; text: string }[],
  userPrompt: string
): Promise<string> {
  return streamGemini(apiKey, emotionalMode, conversationHistory, userPrompt, () => {})
}
