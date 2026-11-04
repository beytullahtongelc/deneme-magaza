# Deneme Mağaza — Canlı Sanal Deneme Kabini (Test)

Kameradan canlı kıyafet deneme testi. Decart'ın Lucy VTON modelini kullanır.

## 1. Gerekenler
- Node.js 18 veya üstü (https://nodejs.org)
- Decart API anahtarı: https://platform.decart.ai adresinden hesap aç → API Keys

## 2. Bilgisayarda çalıştırma
```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
# .env dosyasını aç, DECART_API_KEY= kısmına anahtarını yapıştır
npm run dev
```
Tarayıcıda **http://localhost:3000** aç → bir üründe "Üzerinde dene" → kameraya izin ver.

## 3. Telefonda test
Tarayıcılar kamerayı yalnızca **HTTPS** adreslerde açar (localhost hariç).
Bu yüzden telefonda `http://192.168.x.x:3000` ile açarsan kamera çalışmaz. İki yol:

**A) Hızlı tünel (5 dk):** Bilgisayarda site çalışırken yeni terminalde:
```bash
npx cloudflared tunnel --url http://localhost:3000
```
Verdiği `https://....trycloudflare.com` linkini telefonda aç.

**B) Kalıcı yayın:** Klasörü GitHub'a yükle, Render.com'da "New Web Service" →
Build: `npm install && npm run build`, Start: `npm start`,
Environment'a `DECART_API_KEY` ekle. Otomatik HTTPS link verir.

## 4. Kendi ürünlerini eklemek
- Fotoğrafı `public/products/` içine koy (düz/beyaz arka plan, sadece kıyafet, en az 512×512).
- `public/products.json`'a ekle. `prompt` İngilizce, 20–30 kelime, renk/kumaş/kesim içersin:
  `"Substitute the current top with a beige wool overcoat with wide lapels, long length, relaxed fit"`
- Yeni bir şey ekleniyorsa (şapka gibi): `"Add a navy knit beanie to the person's head"`
- Kabindeki "Kendi kıyafet fotoğrafınla test et" ile dosya eklemeden de deneyebilirsin.

## Dosyalar
- `server.js` — siteyi yayınlar, API anahtarını gizli tutup kısa ömürlü token üretir
- `src/tryon.js` — kamera + Decart bağlantısı (değiştirirsen `npm run build`)
- `public/` — sayfa, ürünler, görseller

⚠️ `.env` dosyasını (API anahtarı) kimseyle paylaşma, GitHub'a yükleme (.gitignore hazır).
