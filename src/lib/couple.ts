import type { AuthUser } from "@/lib/auth"

export type CouplePartner = {
  name: string
  email: string
}

type CoupleBond = {
  emails: [string, string]
}

type PendingInvite = {
  code: string
  fromEmail: string
  fromName: string
}

type CoupleStore = {
  bonds: CoupleBond[]
  invites: PendingInvite[]
}

const STORE_KEY = "cbd-couple"
const USERS_KEY = "cbd-users"
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function emptyStore(): CoupleStore {
  return { bonds: [], invites: [] }
}

function readStore(): CoupleStore {
  if (typeof window === "undefined") return emptyStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as CoupleStore
    return {
      bonds: Array.isArray(parsed.bonds) ? parsed.bonds : [],
      invites: Array.isArray(parsed.invites) ? parsed.invites : [],
    }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: CoupleStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function readUserName(email: string): string | null {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return null
    const users = JSON.parse(raw) as AuthUser[]
    if (!Array.isArray(users)) return null
    const hit = users.find((u) => u.email === email)
    return hit?.name ?? null
  } catch {
    return null
  }
}

function makeCode(existing: Set<string>): string {
  for (let attempt = 0; attempt < 40; attempt++) {
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    }
    if (!existing.has(code)) return code
  }
  throw new Error("Não foi possível gerar código")
}

function bondPartnerEmail(bond: CoupleBond, email: string): string | null {
  if (bond.emails[0] === email) return bond.emails[1]
  if (bond.emails[1] === email) return bond.emails[0]
  return null
}

export function getPartner(email: string): CouplePartner | null {
  const normalized = email.trim().toLowerCase()
  const store = readStore()
  const bond = store.bonds.find((b) => bondPartnerEmail(b, normalized))
  if (!bond) return null
  const partnerEmail = bondPartnerEmail(bond, normalized)
  if (!partnerEmail) return null
  return {
    email: partnerEmail,
    name: readUserName(partnerEmail) ?? partnerEmail,
  }
}

export function getPendingInvite(email: string): PendingInvite | null {
  const normalized = email.trim().toLowerCase()
  return (
    readStore().invites.find((i) => i.fromEmail === normalized) ?? null
  )
}

export function createInviteCode(user: AuthUser): string {
  const email = user.email.trim().toLowerCase()
  if (getPartner(email)) throw new Error("Você já tem um vínculo")

  const store = readStore()
  const existing = store.invites.find((i) => i.fromEmail === email)
  if (existing) return existing.code

  const used = new Set(store.invites.map((i) => i.code))
  const code = makeCode(used)
  store.invites = [
    ...store.invites.filter((i) => i.fromEmail !== email),
    { code, fromEmail: email, fromName: user.name },
  ]
  writeStore(store)
  return code
}

export function cancelInvite(email: string) {
  const normalized = email.trim().toLowerCase()
  const store = readStore()
  store.invites = store.invites.filter((i) => i.fromEmail !== normalized)
  writeStore(store)
}

export function acceptInviteCode(
  code: string,
  user: AuthUser
): CouplePartner {
  const normalized = user.email.trim().toLowerCase()
  const cleaned = code.trim().toUpperCase()
  if (cleaned.length !== 6) throw new Error("Código inválido")
  if (getPartner(normalized)) throw new Error("Você já tem um vínculo")

  const store = readStore()
  const invite = store.invites.find((i) => i.code === cleaned)
  if (!invite) throw new Error("Código não encontrado")
  if (invite.fromEmail === normalized) {
    throw new Error("Esse código é o seu")
  }
  if (getPartner(invite.fromEmail)) {
    throw new Error("Convite já usado")
  }

  store.bonds = [
    ...store.bonds,
    { emails: [invite.fromEmail, normalized] },
  ]
  store.invites = store.invites.filter(
    (i) =>
      i.code !== cleaned &&
      i.fromEmail !== invite.fromEmail &&
      i.fromEmail !== normalized
  )
  writeStore(store)

  return {
    email: invite.fromEmail,
    name: invite.fromName || readUserName(invite.fromEmail) || invite.fromEmail,
  }
}

export function unlinkCouple(email: string) {
  const normalized = email.trim().toLowerCase()
  const store = readStore()
  store.bonds = store.bonds.filter((b) => !bondPartnerEmail(b, normalized))
  writeStore(store)
}
