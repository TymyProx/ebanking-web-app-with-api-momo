import fs from "fs"
import path from "path"

const root = path.resolve("app")
const extra = [
  path.resolve("components/layout/header.tsx"),
  path.resolve("components/layout/sidebar.tsx"),
]

const IMPORT_LINE = `import { getTabId } from "@/lib/client-tab-id"\n`

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, files)
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) files.push(p)
  }
  return files
}

const files = [...walk(root), ...extra.filter((f) => fs.existsSync(f))]

for (const file of files) {
  let src = fs.readFileSync(file, "utf8")
  if (!src.includes("getTabId()")) continue
  if (src.includes('from "@/lib/client-tab-id"') || src.includes("from '@/lib/client-tab-id'")) continue

  if (src.includes('"use client"') || src.includes("'use client'")) {
    src = src.replace(/("use client"|'use client')\r?\n/, (m) => `${m}${IMPORT_LINE}`)
  } else {
    src = `${IMPORT_LINE}${src}`
  }

  fs.writeFileSync(file, src)
  console.log("import added", file)
}
