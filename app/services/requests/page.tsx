import { useState } from "react";
import { Button, Input, Textarea, Label, Checkbox } from "@/components/ui";
import { Clock, Send, CreditCard } from "lucide-react";

export default function CreditForm({ tenantId, accounts, formatAmount }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // bloque l'envoi classique du formulaire
    if (!selectedAccount) return alert("Veuillez sélectionner un compte !");
    if (!selectedService) return alert("Veuillez sélectionner un service !");
    if (!formData.terms) return alert("Vous devez accepter les conditions.");

    setIsSubmitting(true);

    try {
      const response = await fetch(`/tenant/${tenantId}/demande-credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            applicantName: formData.contact_name || "", // si tu as un champ nom
            creditAmount: formData.creditAmount || "",
            durationMonths: formData.durationMonths || "",
            purpose: formData.comments || "", // utilisation du champ comments comme purpose
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        alert("Erreur lors de l'envoi de la demande.");
      } else {
        alert("Demande envoyée avec succès !");
        setFormData({});
        setSelectedAccount(null);
        setSelectedService(null);
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur réseau est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Compte concerné */}
      <div>
        <Label htmlFor="account">Compte concerné *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedAccount === account.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedAccount(account.id)}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-sm">{account.name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">***{account.number.slice(-4)}</p>
              <p className="text-sm font-bold mt-1">
                {formatAmount(account.balance, account.currency)} {account.currency}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Form */}
      {renderServiceForm()}

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="font-medium">Informations de contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_phone">Téléphone *</Label>
            <Input
              id="contact_phone"
              placeholder="+224 6XX XXX XXX"
              value={formData.contact_phone || ""}
              onChange={(e) => handleInputChange("contact_phone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Email *</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="votre@email.com"
              value={formData.contact_email || ""}
              onChange={(e) => handleInputChange("contact_email", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Additional Comments */}
      <div>
        <Label htmlFor="comments">Commentaires additionnels</Label>
        <Textarea
          id="comments"
          placeholder="Informations supplémentaires (optionnel)"
          value={formData.comments || ""}
          onChange={(e) => handleInputChange("comments", e.target.value)}
        />
      </div>

      {/* Terms */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={formData.terms || false}
          onCheckedChange={(checked) => handleInputChange("terms", checked)}
        />
        <Label htmlFor="terms" className="text-sm">
          J'accepte les{" "}
          <a href="#" className="text-blue-600 hover:underline">
            conditions générales
          </a>{" "}
          et autorise le traitement de ma demande
        </Label>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting || !formData.terms} className="w-full mt-4">
        {isSubmitting ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Envoyer la demande
          </>
        )}
      </Button>
    </form>
  );
}
