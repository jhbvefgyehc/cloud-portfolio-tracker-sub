import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState(1);
  const [avgPrice, setAvgPrice] = useState("");
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    // expose helper to manually add holdings from the browser console for quick testing:
    // run: __ADD_HOLDING_FROM_CONSOLE({ id: 999, symbol: 'AAPL', quantity: 1, avgPrice: 100 })
    window.__ADD_HOLDING_FROM_CONSOLE = (h) => {
      try {
        setHoldings(prev => Array.isArray(prev) ? [...prev, h] : [h]);
        console.log("DEBUG: added from console", h);
      } catch (e) {
        console.error("DEBUG: add from console failed", e);
      }
    };

    fetchHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHoldings() {
    try {
      console.log("DEBUG: fetching holdings...");
      const r = await fetch(`${API_BASE}/api/holdings`);
      if (!r.ok) {
        console.error("DEBUG: fetchHoldings bad status", r.status);
        setHoldings([]);
        return;
      }
      const j = await r.json();
      console.log("DEBUG: fetched holdings", j);
      setHoldings(Array.isArray(j) ? j : []);
    } catch (err) {
      console.error("DEBUG: fetchHoldings error", err);
      setHoldings([]);
    }
  }

  async function addHolding(e) {
    if (e && e.preventDefault) e.preventDefault();
    const body = {
      symbol: String(symbol || "").toUpperCase(),
      quantity: Number(quantity || 0),
      avgPrice: Number(avgPrice || 0)
    };

    console.log("DEBUG: addHolding ->", body);

    try {
      const r = await fetch(`${API_BASE}/api/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      console.log("DEBUG: POST status =", r.status);
      const json = await r.json();
      console.log("DEBUG: POST response =", json);

      if (!r.ok) {
        alert("Add failed: " + (json?.error || r.status));
        return;
      }

      setHoldings(prev => {
        const next = Array.isArray(prev) ? [...prev, json] : [json];
        console.log("DEBUG: updated holdings, length =", next.length);
        return next;
      });

      // reset inputs a little for convenience
      setSymbol("");
      setQuantity(1);
      setAvgPrice("");
    } catch (err) {
      console.error("DEBUG: addHolding error", err);
      alert("Network or JS error. See console.");
    }
  }

  async function fetchPrices() {
    try {
      console.log("DEBUG: fetching prices for", holdings.length, "holdings");
      const updated = await Promise.all(holdings.map(async (h) => {
        try {
          // call /api/price (server supports it); falls back on server to mock if no API key
          const r = await fetch(`${API_BASE}/api/price?symbol=${encodeURIComponent(h.symbol)}`);
          if (!r.ok) {
            console.warn("DEBUG: price fetch bad status for", h.symbol, r.status);
            return { ...h, currentPrice: null };
          }
          const j = await r.json();
          return { ...h, currentPrice: j.price };
        } catch (e) {
          console.error("DEBUG: price fetch error for", h.symbol, e);
          return { ...h, currentPrice: null };
        }
      }));

      console.log("DEBUG: updated holdings with prices", updated);
      setHoldings(updated);
    } catch (err) {
      console.error("DEBUG: fetchPrices error", err);
    }
  }

  function totalValue() {
    return holdings.reduce((s, h) => s + ((h.currentPrice || 0) * h.quantity), 0).toFixed(2);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Portfolio Tracker</h1>

      <form onSubmit={addHolding} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          placeholder="Symbol (e.g. AAPL)"
          style={{ padding: 6 }}
        />
        <input
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="Qty"
          type="number"
          style={{ width: 80, padding: 6 }}
        />
        <input
          value={avgPrice}
          onChange={e => setAvgPrice(e.target.value)}
          placeholder="Avg price (optional)"
          type="number"
          step="0.01"
          style={{ width: 140, padding: 6 }}
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ marginBottom: 12 }}>
        <button onClick={fetchPrices}>Fetch prices</button>
        <button
          onClick={async () => {
            try {
              await fetch(`${API_BASE}/api/holdings/clear`, { method: "POST" });
              setHoldings([]);
            } catch (e) {
              console.error("DEBUG: clear holdings error", e);
            }
          }}
          style={{ marginLeft: 8 }}
        >
          Clear
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Symbol</th>
            <th>Qty</th>
            <th>Avg Price</th>
            <th>Current</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(h => (
            <tr key={h.id ?? `${h.symbol}-${Math.random()}`}>
              <td style={{ padding: "6px 4px" }}>{h.symbol}</td>
              <td style={{ textAlign: "center" }}>{h.quantity}</td>
              <td style={{ textAlign: "center" }}>{h.avgPrice?.toFixed ? h.avgPrice.toFixed(2) : h.avgPrice}</td>
              <td style={{ textAlign: "center" }}>{h.currentPrice != null ? Number(h.currentPrice).toFixed(2) : "-"}</td>
              <td style={{ textAlign: "center" }}>{h.currentPrice != null ? (Number(h.currentPrice) * h.quantity).toFixed(2) : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <strong>Total value:</strong> ${totalValue()}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        Backend: {API_BASE} — set VITE_API_BASE to override.
      </p>
    </div>
  );
}
