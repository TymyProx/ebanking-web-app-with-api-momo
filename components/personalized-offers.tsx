"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/api-url";
import { TENANT_ID } from "@/lib/config";

interface Offer {
  id: string;
  name: string;
  content?: { title?: string; body?: string; ctaText?: string };
  productId?: string;
}

export function PersonalizedOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiBaseUrl()}/tenant/${TENANT_ID}/analytics/offers/active`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch {}
  };

  const trackInteraction = async (offerId: string, action: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${getApiBaseUrl()}/tenant/${TENANT_ID}/analytics/offers/${offerId}/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ data: { action, platform: "eportal" } }),
      });
    } catch {}
  };

  if (offers.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Offres pour vous</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => trackInteraction(offer.id, "click")}
          >
            <p className="text-sm font-medium text-gray-900">
              {offer.content?.title || offer.name}
            </p>
            {offer.content?.body && (
              <p className="text-xs text-gray-500 mt-1">{offer.content.body}</p>
            )}
            {offer.content?.ctaText && (
              <span className="text-xs text-blue-600 font-medium mt-2 inline-block">
                {offer.content.ctaText} &rarr;
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
