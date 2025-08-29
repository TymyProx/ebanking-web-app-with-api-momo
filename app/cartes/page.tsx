"use client";
import { useEffect, useState } from "react";

const BASE_URL = "http://192.168.1.200:8080/api";
const TENANT_ID = "11cacc69-5a49-4f01-8b16-e8f473746634";
const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJhYWY0OWMzLThlOGUtNDZkYS1iZDM4LWIwZDlmNTFiODAzNyIsImlhdCI6MTc1NjQ1OTYzMCwiZXhwIjoxNzU3MDY0NDMwfQ.F1glqniLIDoTxs6PmLa6AEiuaHvAQqWSyCkPswF7n80"; // ← remplace par ton vrai token

type Card = {
  id: string;
  numCard: string;
  typCard: string;
  status: string;
  dateEmission: string;   // ex: "2025-08-29"
  dateExpiration: string; // ex: "2025-08-29"
  idClient: string;
  // champs meta éventuels de ta réponse (facultatif à l'affichage)
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdById?: string;
  updatedById?: string;
  importHash?: string;
  tenantId?: string;
};

type CardsResponse = {
  rows: Card[];
  count: number;
};

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAllCards() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${BASE_URL}/tenant/${TENANT_ID}/card`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`,
          },
          cache: "no-store",
        },
      );

      const contentType = res.headers.get("content-type") || "";
      const bodyText = await res.text();

      if (!res.ok) {
        throw new Error(`API ${res.status}: ${bodyText || "Erreur inconnue"}`);
      }

      let parsed: CardsResponse | null = null;
      if (contentType.includes("application/json") && bodyText) {
        parsed = JSON.parse(bodyText) as CardsResponse;
      }

      const list = parsed?.rows ?? [];
      const count = parsed?.count ?? list.length;

      setCards(list);
      setTotal(count);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setCards([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllCards();
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Cartes</h1>
        <button
          onClick={fetchAllCards}
          className="rounded px-3 py-2 border bg-black text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Rafraîchir"}
        </button>
      </header>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 mb-3 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {!error && (
        <p className="text-sm text-gray-600 mb-3">
          Total (count): <b>{total}</b> • Affichées: <b>{cards.length}</b>
        </p>
      )}

      {loading && <p>Chargement des cartes…</p>}

      {!loading && !error && cards.length === 0 && (
        <p className="text-gray-600">Aucune carte trouvée.</p>
      )}

      {cards.length > 0 && (
        <ul className="space-y-3">
          {cards.map((c, idx) => (
            <li
              key={c.id || idx}
              className="border rounded p-3 shadow-sm bg-white"
            >
              <div className="text-sm text-gray-500 mb-1">
                ID : {c.id || "N/A"}
              </div>
              <div className="font-semibold text-lg mb-1">
                {c.typCard || "Type inconnu"} — {c.numCard || "Numéro inconnu"}{" "}
                <span className="text-sm text-gray-600">({c.status || "?"})</span>
              </div>
              <div className="text-sm text-gray-700">
                Émise le : {c.dateEmission || "N/A"} • Expire le : {c.dateExpiration || "N/A"}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Client : {c.idClient || "N/A"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
