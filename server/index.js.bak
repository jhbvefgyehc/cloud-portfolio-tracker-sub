import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const API_KEY = process.env.FINNHUB_KEY || null;

// in-memory holdings store
let holdings = [];
let nextId = 1;

// root
app.get("/", (req, res) => res.json({ ok: true, message: "Portfolio Tracker API" }));

// create holding
app.post("/api/holdings", (req, res) => {
  try {
    const { symbol, quantity, avgPrice } = req.body || {};
    if (!symbol || !quantity) return res.status(400).json({ error: "symbol and quantity required" });
    const h = { id: nextId++, symbol: String(symbol).toUpperCase(), quantity: Number(quantity), avgPrice: Number(avgPrice || 0) };
    holdings.push(h);
    return res.json(h);
  } catch (e) {
    console.error("POST /api/holdings error", e);
    return res.status(500).json({ error: "internal" });
  }
});

// list holdings
app.get("/api/holdings", (req, res) => res.json(holdings));

// clear holdings
app.post("/api/holdings/clear", (req, res) => {
  holdings = [];
  nextId = 1;
  res.json({ ok: true });
});

// price endpoint (uses Finnhub if API key present, otherwise mock)
async function fetchPrice(symbol) {
  if (!symbol) throw new Error("symbol required");
  const s = String(symbol).toUpperCase();
  if (!API_KEY) {
    // deterministic mock: based on symbol chars
    const mockBase = Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0) % 200 + 20;
    return Number((mockBase + (Math.random() * 5)).toFixed(2));
  }
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${API_KEY}`;
  const r = await axios.get(url, { timeout: 5000 });
  // Finnhub returns { c: current, ... }
  const price = r?.data?.c ?? null;
  if (price === null) throw new Error("price not available");
  return Number(price);
}

// /api/price
app.get("/api/price", async (req, res) => {
  const symbol = (req.query.symbol || "").toString();
  if (!symbol) return res.status(400).json({ error: "symbol required" });
  try {
    const price = await fetchPrice(symbol);
    return res.json({ symbol: symbol.toUpperCase(), price, source: API_KEY ? "finnhub" : "mock" });
  } catch (e) {
    console.error("GET /api/price error", e && e.message);
    return res.status(502).json({ error: "price_fetch_failed", detail: String(e) });
  }
});

// keep old route name too
app.get("/api/quote", async (req, res) => {
  req.url = req.url; // noop
  return app._router.handle(req, res, () => {}, "get");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
