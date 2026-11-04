// Basit test sunucusu: siteyi yayınlar ve Decart için kısa ömürlü token üretir.
// API anahtarın SADECE burada (sunucuda) durur, tarayıcıya asla gitmez.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDecartClient } from "@decartai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env dosyasını oku (ekstra paket gerektirmez)
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.DECART_API_KEY;
if (!API_KEY || API_KEY.startsWith("buraya")) {
  console.warn("\n⚠️  DECART_API_KEY yok. .env dosyasına anahtarını yaz (platform.decart.ai).\n");
}

const PUBLIC = path.join(__dirname, "public");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  // Token endpoint'i
  if (req.method === "POST" && req.url === "/api/tokens") {
    try {
      if (!API_KEY) throw new Error("Sunucuda DECART_API_KEY tanımlı değil");
      const client = createDecartClient({ apiKey: API_KEY });
      const token = await client.tokens.create();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(token));
    } catch (err) {
      console.error("Token hatası:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(err.message || err) }));
    }
  }

  // Statik dosyalar
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC, urlPath));
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Bulunamadı"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Test mağazası çalışıyor: http://localhost:${PORT}\n`);
});
