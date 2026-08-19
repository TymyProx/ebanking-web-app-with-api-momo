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
  const next = src
    .replace(/,, tabId\?: string/g, ", tabId?: string")
    .replace(/, tabId\?: string, tabId\?: string/g, ", tabId?: string")
  if (next !== src) {
    fs.writeFileSync(file, next)
    console.log("fixed", file)
  }
}
