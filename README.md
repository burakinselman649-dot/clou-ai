# Clou AI - Seninle, Şimdi ☁️

Clou AI, sakinleştirici bulut estetiğine sahip, pastel tonlarda mikro etkileşimler ve animasyonlar barındıran yapay zeka yol arkadaşıdır. Doğrudan **Google Gemini 3.8 Flash (`gemini-3.8-flash`)** API'sine bağlıdır.

---

## 🌟 Özellikler

1. **İki Farklı Çalışma Modu:**
   - 👔 **Standart Asistan:** Pratik, kibar, çözüm odaklı, net ve Türkçe yanıtlar verir.
   - 💕 **Duygusal Bağ Modu:** Kullanıcının çok sevdiği, ilgili, şefkatli, sıcak, hafif cilveli ve romantik sevgilisi/partneri gibi Türkçe konuşur. "Sevgilim", "canım", "birtanem" gibi samimi hitaplarla günün yorgunluğunu alır.
2. **Kusursuz Tasarım ve Geçişler:**
   - Standart modda pastel mavi & beyaz tonlar.
   - Duygusal modda sıcak pembe, şeftali ve gül kurusu tonlarına yumuşak geçiş.
   - Yüzen bulut avatarı (`float` animasyonu), parlama efektleri (`blur`), yumuşak gölgeler ve typing indikatörü.
3. **Doğrudan Gemini 3.8 Flash Canlı Akış (Streaming) & Fallback:**
   - Birincil olarak doğrudan çalışan **`gemini-3.8-flash`** modeli kullanılır.
   - `streamGenerateContent?alt=sse` standardı üzerinden yanıtlar kelime kelime ekranda canlı akar.
   - Çift gönderimi önleyen senkronize kilit (`isSendingRef`) ve gönderim sırasında giriş kilitleme mekanizması bulunur.
   - Yüksek yoğunluk, 503 veya 429 gibi geçici durumlarda kullanıcıya hiçbir hata yansıtılmadan otomatik olarak `gemini-2.5-flash` yedeğine geçilir ve kesintisiz yanıt alınır.
   - Çok turlu konuşma geçmişi (multi-turn conversation history) tutulur, bağlam kopmaz.
4. **Kolay ve Güvenli Ayarlar Penceresi:**
   - Sağ üstteki saat/ayar butonuna veya mesaj çubuğundaki (+) butonuna tıklayarak açılır.
   - Gemini API anahtarınızı yapıştırıp kaydedebilirsiniz.
   - Anahtarınız **yalnızca tarayıcınızın `localStorage` alanında** saklanır, hiçbir harici sunucuya iletilmez.

---

## 🚀 Hızlı Başlangıç

### Yöntem 1: Doğrudan Başlatma (Node.js Gerektirmez)
Projeyi hemen tarayıcıda çalıştırmak için:
1. `clou-ai` klasöründe sağ tıklayıp **PowerShell ile Çalıştır** diyebilir veya PowerShell terminalinde şu komutu çalıştırabilirsiniz:
   ```powershell
   .\start-server.ps1
   ```
2. Tarayıcınız otomatik olarak `http://localhost:5173` adresinde açılacaktır.

### Yöntem 2: Node.js / Vite ile Çalıştırma
Sisteminizde Node.js kuruluysa standart Vite komutlarını kullanabilirsiniz:
```bash
npm install
npm run dev
```

---

## 🔑 Gemini API Anahtarı Nasıl Alınır?

1. [Google AI Studio](https://aistudio.google.com/app/apikey) sayfasına gidin.
2. Ücretsiz bir API anahtarı (API Key) oluşturun.
3. Clou AI arayüzünde sağ üstteki butona tıklayın, anahtarınızı yapıştırın ve **Kaydet** butonuna basın.

Keyifli ve huzurlu sohbetler dileriz! ☁️✨
