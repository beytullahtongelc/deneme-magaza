// Tarayıcı tarafı: ürünleri listeler, kamerayı açar, Decart Lucy VTON'a bağlanır.
import { createDecartClient, models } from "@decartai/sdk";

const $ = (s) => document.querySelector(s);
const tl = (n) => n.toLocaleString("tr-TR") + " ₺";

let products = [];
let rtClient = null;
let camStream = null;
let connecting = null;
let currentId = null;

const client = createDecartClient({
  // Her bağlantıdan hemen önce sunucumuzdan kısa ömürlü token al
  apiKeyProvider: async () => {
    const res = await fetch("/api/tokens", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Token alınamadı");
    return data.apiKey;
  },
});

// ---------- Mağaza ----------
async function loadProducts() {
  products = await (await fetch("products.json")).json();
  $("#grid").innerHTML = products.map((p) => `
    <article class="card">
      <div class="card-img"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="price">${tl(p.price)}</p>
        <div class="card-actions">
          <button class="btn btn-ghost" type="button">Sepete ekle</button>
          <button class="btn btn-primary" data-try="${p.id}" type="button">👕 Üzerinde dene</button>
        </div>
      </div>
    </article>`).join("");

  $("#rail").innerHTML = products.map((p) => `
    <button class="rail-item" data-pick="${p.id}" type="button" title="${p.name}">
      <img src="${p.image}" alt="${p.name}">
    </button>`).join("");
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-try],[data-pick]");
  if (!t) return;
  const id = t.dataset.try || t.dataset.pick;
  openTryOn(id);
});

// ---------- Deneme kabini ----------
function setStatus(text, kind = "") {
  const el = $("#status");
  el.textContent = text;
  el.className = "status " + kind;
  el.hidden = !text;
}

async function connect() {
  if (rtClient && rtClient.isConnected()) return;
  if (connecting) return connecting;
  connecting = (async () => {
    setStatus("Kamera açılıyor…");
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    $("#selfie").srcObject = camStream;

    setStatus("Yapay zekâya bağlanılıyor…");
    rtClient = await client.realtime.connect(camStream, {
      model: models.realtime("lucy-vton-latest"),
      onRemoteStream: (remote) => {
        $("#output").srcObject = remote;
      },
    });
    rtClient.on("queuePosition", (q) => {
      const pos = q?.position ?? q;
      if (pos) setStatus(`Sıradasın: ${pos}. sıra…`);
    });
    rtClient.on("connectionChange", (s) => {
      if (s === "disconnected") setStatus("Bağlantı koptu. Kabini kapatıp yeniden aç.", "err");
    });
    rtClient.on("error", (err) => setStatus("Hata: " + (err?.message || err), "err"));
  })();
  try { await connecting; } finally { connecting = null; }
}

async function applyGarment(image, prompt) {
  setStatus("Kıyafet giydiriliyor…");
  await rtClient.set({ image, prompt, enhance: false });
  setTimeout(() => setStatus(""), 1600);
}

async function openTryOn(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  currentId = id;
  $("#modal").hidden = false;
  document.body.classList.add("lock");
  $("#modal-title").textContent = p.name;
  $("#modal-price").textContent = tl(p.price);
  document.querySelectorAll(".rail-item").forEach((b) => b.classList.toggle("on", b.dataset.pick === id));

  try {
    await connect();
    if (currentId !== id) return; // kullanıcı bu arada başka ürüne geçti
    const blob = await (await fetch(p.image)).blob();
    await applyGarment(blob, p.prompt);
  } catch (err) {
    console.error(err);
    const msg = err?.name === "NotAllowedError"
      ? "Kamera izni verilmedi. Tarayıcı ayarlarından kameraya izin ver."
      : "Bağlanılamadı: " + (err?.message || err);
    setStatus(msg, "err");
  }
}

function closeTryOn() {
  $("#modal").hidden = true;
  document.body.classList.remove("lock");
  try { rtClient?.disconnect(); } catch {}
  rtClient = null;
  camStream?.getTracks().forEach((t) => t.stop());
  camStream = null;
  $("#output").srcObject = null;
  $("#selfie").srcObject = null;
  setStatus("");
}
$("#close").addEventListener("click", closeTryOn);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) closeTryOn(); });

// ---------- Kendi kıyafetini dene (test için) ----------
$("#custom-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = $("#custom-file").files[0];
  const prompt = $("#custom-prompt").value.trim();
  if (!file || !prompt) return setStatus("Bir fotoğraf seç ve açıklama yaz.", "err");
  currentId = "custom";
  document.querySelectorAll(".rail-item").forEach((b) => b.classList.remove("on"));
  $("#modal-title").textContent = "Kendi ürünün";
  $("#modal-price").textContent = "";
  try {
    await connect();
    await applyGarment(file, prompt);
  } catch (err) {
    setStatus("Hata: " + (err?.message || err), "err");
  }
});

loadProducts();
