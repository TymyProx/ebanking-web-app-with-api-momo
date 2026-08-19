import fs from "fs"
import path from "path"

const root = path.resolve("app")

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, files)
    else if (ent.name === "actions.ts") files.push(p)
  }
  return files
}

for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8")
  if (!src.includes('get("token")')) continue

  let changed = false

  if (!src.includes("getServerAuthToken")) {
    if (src.includes('"use server"')) {
      src = src.replace(/"use server"\r?\n/, (m) => `${m}import { getServerAuthToken } from "@/lib/server-auth-token"\n`)
    } else {
      src = `import { getServerAuthToken } from "@/lib/server-auth-token"\n${src}`
    }
    changed = true
  }

  const before = src
  src = src.replace(/\(await cookies\(\)\)\.get\("token"\)\?\.value/g, "(await getServerAuthToken(tabId))")
  src = src.replace(/cookieStore\.get\("token"\)\?\.value/g, "(await getServerAuthToken(tabId))")
  if (src !== before) changed = true

  if (!changed) continue

  src = src.replace(/export async function (\w+)\(([^)]*)\)/g, (match, name, params) => {
    if (params.includes("tabId")) return match
    const trimmed = params.trim()
    if (!trimmed) return `export async function ${name}(tabId?: string)`
    return `export async function ${name}(${trimmed}, tabId?: string)`
  })

  fs.writeFileSync(file, src)
  console.log("patched", file)
}
