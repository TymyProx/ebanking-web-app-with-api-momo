"use client"

import { encryptAesGcmToJson, importAesGcmKeyFromBase64 } from "./crypto"

type CommandeFormValues = {
  dateorder?: string
  nbrefeuille?: number
  nbrechequier?: number | string
  intitulecompte?: string
  numcompteId?: string
  commentaire?: string
  talonCheque?: boolean | string
  typeCheque?: string
  referenceCommande?: string
}

export async function buildCommandeSecurePayload(
  values: CommandeFormValues,
  base64Key: string,
  keyId: string,
) {
  const key = await importAesGcmKeyFromBase64(base64Key)

  const secure: Record<string, any> = {}

  async function putEnc(name: string, value: any) {
    if (value === undefined || value === null) return
    secure[`${name}_json`] = await encryptAesGcmToJson(value, key)
  }

  await Promise.all([
    putEnc("intitulecompte", values.intitulecompte),
    putEnc("numcompteId", values.numcompteId),
    putEnc("commentaire", values.commentaire),
    putEnc("typeCheque", values.typeCheque),
    putEnc("referenceCommande", values.referenceCommande),
    putEnc("nbrechequier", values.nbrechequier),
    putEnc("talonCheque", values.talonCheque === true || values.talonCheque === "true"),
  ])

  // Non sensibles conservés en clair (adaptable si besoin)
  if (values.nbrefeuille !== undefined) secure.nbrefeuille = Number(values.nbrefeuille)
  if (values.dateorder) secure.dateorder = values.dateorder

  secure.key_id = keyId
  return secure
}



