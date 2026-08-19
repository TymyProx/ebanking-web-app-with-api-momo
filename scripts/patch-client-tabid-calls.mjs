import fs from "fs"
import path from "path"

const root = path.resolve("app")

const actionCalls = [
  "getAccounts",
  "getUserTransactions",
  "getBeneficiaries",
  "createTransfer",
  "submitTransfer",
]

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, files)
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) files.push(p)
  }
  return files
}

for (const file of walk(root)) {
  if (file.includes(`${path.sep}actions.ts`)) continue
  if (file.includes("node_modules")) continue

  let src = fs.readFileSync(file, "utf8")
  if (!src.includes('"use client"') && !src.includes("'use client'")) continue

  let changed = false
  for (const fn of actionCalls) {
    const re = new RegExp(`\\b${fn}\\(\\)`, "g")
    if (re.test(src)) {
      src = src.replace(re, `${fn}(getTabId())`)
      changed = true
    }
  }

  if (!changed) continue

  if (!src.includes("getTabId")) {
    if (src.includes('"use client"')) {
      src = src.replace(/"use client"\r?\n/, (m) => `${m}import { getTabId } from "@/lib/client-tab-id"\n`)
    }
  }

  fs.writeFileSync(file, src)
  console.log("patched client", file)
}
