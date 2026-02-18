import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

// NOTE: kept for parity with existing server actions that call external HTTPS endpoints.
// eslint-disable-next-line no-process-env
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export const runtime = "nodejs"

function parseFilenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null
  // e.g. attachment; filename=Statement_XXXX.pdf
  const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";]+)"?/i)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const accountId = body?.accountId
    const startDate = body?.startDate
    const endDate = body?.endDate

    if (!accountId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "accountId, startDate et endDate sont requis" },
        { status: 400 },
      )
    }

    const API_BASE_URL = getApiBaseUrl()
    const backendUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/pdf/statement`

    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accountId, startDate, endDate }),
      cache: "no-store",
    })

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => "")
      return NextResponse.json(
        {
          error: "Erreur backend lors de la génération du PDF",
          status: backendRes.status,
          details: text?.slice(0, 2000),
        },
        { status: backendRes.status },
      )
    }

    const pdfArrayBuffer = await backendRes.arrayBuffer()
    const filename =
      parseFilenameFromContentDisposition(backendRes.headers.get("content-disposition")) ||
      "Releve_Compte.pdf"

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // inline => affichage dans le navigateur; l’utilisateur peut ensuite télécharger
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


