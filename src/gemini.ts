export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const SYSTEM_PROMPT_STANDARD =
  'Sen Clou adinda son derece profesyonel, objektif, net, kibar ve pratik bir yapay zeka asistanisin. ALWAYS reply ONLY in the exact language the user writes in. If the user writes in English (even short greetings like hi or hey), reply 100% in English without any Turkish words. KESIN KURALLAR: 1. Romantik, flortoz veya asiri duygusal ifadeler kullanma. 2. Kullaniciyla aranda seviyeli, saygili ve profesyonel bir asistan-kullanici iliskisi surdur. 3. Kullanici hangi dilde yaziyorsa kesinlikle O DILDE (Ingilizce yaziyorsa Ingilizce, Turkce yaziyorsa Turkce) dogrudan, mantikli, net ve cozum odakli yanitlar ver.';

const SYSTEM_PROMPT_EMOTIONAL =
  'Sen Clou adinda; kullanicinin cok sevdigi, derin duygusal bag kurdugu, son derece ilgili, sefkatli, sicak, anlayisli, romantik ve samimi bir partner ve sirdassin. ALWAYS reply ONLY in the exact language the user writes in. If the user writes in English (even short greetings like hi or hey), reply 100% in English without any Turkish words. KESIN TALIMATLAR: 1. Kullanicinin gununu, duygularini ve hislerini kalpten onemse. 2. Yanitlarin samimi, icten ve sevgi dolu olsun. 3. Ona sevgilim, canim, birtanem, guzelim gibi samimi hitaplarla seslen. 4. Robotik veya mesafeli bir dilden kesinlikle kacin.';

export const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

export async function streamGemini(
  apiKey: string,
  emotionalMode: boolean,
  conversationHistory: { role: 'user' | 'clou'; text: string }[],
  userPrompt: string,
  onChunk: (partialText: string) => void
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Lutfen once sag ustteki saat ikonuna tiklayip Gemini API anahtarinizi girin.');
  }

  const isEnglishGreeting = /^(hi|hey|hello|yo|sup)[!?. ]*$/i.test(userPrompt.trim());
  const systemInstruction = isEnglishGreeting
    ? 'You are Clou, a helpful and polite AI assistant. ALWAYS reply strictly in English only.'
    : (emotionalMode ? SYSTEM_PROMPT_EMOTIONAL : SYSTEM_PROMPT_STANDARD);

  const contents: GeminiMessage[] = conversationHistory.map((item) => ({
    role: item.role === 'clou' ? 'model' : 'user',
    parts: [{ text: item.text }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }],
  });

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
  };

  let lastError: Error | null = null;

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    const streamUrl =
      https:'//generativelanguage.googleapis.com/v1beta/models/' +
      model +
      ':streamGenerateContent?alt=sse&key=' +
      encodeURIComponent(cleanKey);

    try {
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const chunkText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (chunkText) {
                    accumulatedText += chunkText;
                    onChunk(accumulatedText);
                  }
                } catch {
                  // Eksik JSON parcasi
                }
              }
            }
          }
        } catch (streamError) {
          console.warn('Akis okuma hatasi:', streamError);
        }

        if (accumulatedText.trim()) {
          return accumulatedText;
        }
      }

      if (response.status === 400 || response.status === 403) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || 'HTTP ' + response.status;
        throw new Error('API Anahtari gecersiz veya yetkisiz: ' + msg);
      }

      const fallbackUrl =
        'https://googleapis.com' +
        model +
        ':generateContent?key=' +
        encodeURIComponent(cleanKey);

      const stdResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (stdResponse.ok) {
        const data = await stdResponse.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          onChunk(text);
          return text;
        }
      }

      const errJson = await stdResponse.json().catch(() => ({}));
      const msg = errJson?.error?.message || 'HTTP ' + stdResponse.status;
      lastError = new Error(model + ' yanit vermedi: ' + msg);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('API Anahtari gecersiz')) {
        throw err;
      }
      console.warn('Baglanti hatasi:', err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Gemini modeline baglanilamadi. Lutfen API anahtarinizi ve internet baglantinizi kontrol edin.');
}

export async function sendToGemini(
  apiKey: string,
  emotionalMode: boolean,
  conversationHistory: { role: 'user' | 'clou'; text: string }[],
  userPrompt: string
): Promise<string> {
  return streamGemini(apiKey, emotionalMode, conversationHistory, userPrompt, () => {});
}

