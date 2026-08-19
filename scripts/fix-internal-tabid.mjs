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
  if (!src.includes("getServerAuthToken(tabId)")) continue

  src = src.replace(
    /async function getCurrentUserInfo\(token\?: string\)/g,
    "async function getCurrentUserInfo(token?: string, tabId?: string)",
  )
  src = src.replace(
    /async function getCurrentClientId\(\): Promise<string>/g,
    "async function getCurrentClientId(tabId?: string): Promise<string>",
  )
  src = src.replace(
    /async function generateReference\(prefix: string\): Promise<string>/g,
    "async function generateReference(prefix: string, tabId?: string): Promise<string>",
  )
  src = src.replace(
    /async function generateReclamationReference\(\): Promise<string>/g,
    "async function generateReclamationReference(tabId?: string): Promise<string>",
  )
  src = src.replace(
    /async function generateFundsProvisionReference\(\): Promise<string>/g,
    "async function generateFundsProvisionReference(tabId?: string): Promise<string>",
  )

  src = src.replace(
    /context\.token \?\? \(await getServerAuthToken\(tabId\)\)/g,
    "context.token ?? (await getServerAuthToken(context.tabId ?? tabId))",
  )

  fs.writeFileSync(file, src)
  console.log("fixed internals", file)
}
