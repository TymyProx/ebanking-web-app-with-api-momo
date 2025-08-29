"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { fetchAllCards, createCardRequest, type Card, type NewCardRequest } from "../../actions/card"

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState<boolean>(false)
  const [formData, setFormData] = useState<NewCardRequest>({
    typCard: "",
    idClient: "",
  })
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  async function loadCards() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchAllCards()
      setCards(response.rows)
      setTotal(response.count)
    } catch (e: any) {
      setError(e?.message ?? String(e))
      setCards([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitNewCard(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.typCard.trim() || !formData.idClient.trim()) {
      setSubmitError("Veuillez remplir tous les champs obligatoires")
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      await createCardRequest(formData)
      setSubmitSuccess("Demande de carte créée avec succès !")
      setFormData({ typCard: "", idClient: "" })
      setShowForm(false)
      // Refresh the cards list
      await loadCards()
    } catch (e: any) {
      setSubmitError(e?.message ?? "Erreur lors de la création de la demande")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setFormData({ typCard: "", idClient: "" })
    setSubmitError(null)
    setSubmitSuccess(null)
    setShowForm(false)
  }

  useEffect(() => {
    loadCards()
  }, [])

  return (
    <main className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Cartes</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="rounded px-3 py-2 border bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={loading || submitting}
          >
            Nouvelle demande de carte
          </button>
          <button
            onClick={loadCards}
            className="rounded px-3 py-2 border bg-black text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Chargement..." : "Rafraîchir"}
          </button>
        </div>
      </header>

      {submitSuccess && (
        <div className="border border-green-200 bg-green-50 text-green-700 rounded p-3 mb-3">{submitSuccess}</div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 mb-3 whitespace-pre-wrap">{error}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Nouvelle demande de carte</h2>

            {submitError && (
              <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 mb-4">{submitError}</div>
            )}

            <form onSubmit={handleSubmitNewCard} className="space-y-4">
              <div>
                <label htmlFor="typCard" className="block text-sm font-medium text-gray-700 mb-1">
                  Type de carte *
                </label>
                <select
                  id="typCard"
                  value={formData.typCard}
                  onChange={(e) => setFormData((prev) => ({ ...prev, typCard: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="DEBIT">Carte de débit</option>
                  <option value="CREDIT">Carte de crédit</option>
                  <option value="PREPAID">Carte prépayée</option>
                </select>
              </div>

              <div>
                <label htmlFor="idClient" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Client *
                </label>
                <input
                  type="text"
                  id="idClient"
                  value={formData.idClient}
                  onChange={(e) => setFormData((prev) => ({ ...prev, idClient: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez l'ID du client"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Création..." : "Créer la demande"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1 bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400 disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!error && (
        <p className="text-sm text-gray-600 mb-3">
          Total (count): <b>{total}</b> • Affichées: <b>{cards.length}</b>
        </p>
      )}

      {loading && <p>Chargement des cartes…</p>}

      {!loading && !error && cards.length === 0 && <p className="text-gray-600">Aucune carte trouvée.</p>}

      {cards.length > 0 && (
        <ul className="space-y-3">
          {cards.map((c, idx) => (
            <li key={c.id || idx} className="border rounded p-3 shadow-sm bg-white">
              <div className="text-sm text-gray-500 mb-1">ID : {c.id || "N/A"}</div>
              <div className="font-semibold text-lg mb-1">
                {c.typCard || "Type inconnu"} — {c.numCard || "Numéro inconnu"}{" "}
                <span className="text-sm text-gray-600">({c.status || "?"})</span>
              </div>
              <div className="text-sm text-gray-700">
                Émise le : {c.dateEmission || "N/A"} • Expire le : {c.dateExpiration || "N/A"}
              </div>
              <div className="text-sm text-gray-600 mt-1">Client : {c.idClient || "N/A"}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
