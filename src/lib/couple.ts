import { apiFetch } from "@/lib/auth"

export type CouplePartner = {
  id?: string
  name: string
  email: string
}

export type PendingInvite = {
  code: string
  createdAt?: string
  expiresAt?: string
}

export type CoupleStats = {
  total: number
  together: number
  mine: number
}

export type CoupleStatus = {
  linked: boolean
  partner: CouplePartner | null
  pendingInvite: PendingInvite | null
  stats?: CoupleStats
}

async function readCoupleError(res: Response, fallback: string) {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    if (body.error?.message) return body.error.message
  } catch {
    // ignore
  }
  return `${fallback}${res.status ? ` (${res.status})` : ""}`
}

function normalizePartner(raw: unknown): CouplePartner | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as { id?: string; name?: string; email?: string }
  if (!p.email || !p.name) return null
  return {
    id: typeof p.id === "string" ? p.id : undefined,
    name: p.name,
    email: p.email,
  }
}

function normalizeInvite(raw: unknown): PendingInvite | null {
  if (!raw || typeof raw !== "object") return null
  const i = raw as {
    code?: string
    createdAt?: string
    expiresAt?: string
  }
  if (!i.code) return null
  return {
    code: i.code,
    createdAt: i.createdAt,
    expiresAt: i.expiresAt,
  }
}

function partnerFromMembers(
  members: unknown,
  selfId?: string
): CouplePartner | null {
  if (!Array.isArray(members)) return null
  const people = members
    .map(normalizePartner)
    .filter((m): m is CouplePartner => Boolean(m))
  if (people.length === 0) return null
  if (selfId) {
    return people.find((m) => m.id && m.id !== selfId) ?? null
  }
  return people.length >= 2 ? people[1] : people[0]
}

/** Aceita shape openapi ({ linked, partner }) e API real ({ id, members }). */
export function normalizeStatus(
  raw: unknown,
  selfId?: string
): CoupleStatus {
  const data = (raw ?? {}) as {
    id?: string
    linked?: boolean
    partner?: unknown
    pendingInvite?: unknown
    members?: unknown
    stats?: {
      total?: number
      together?: number
      mine?: number
    }
  }

  const fromMembers = partnerFromMembers(data.members, selfId)
  const partner = normalizePartner(data.partner) ?? fromMembers
  const linked =
    typeof data.linked === "boolean" ? data.linked : Boolean(partner)

  const stats = data.stats
  return {
    linked,
    partner,
    pendingInvite: normalizeInvite(data.pendingInvite),
    stats: stats
      ? {
          total: Number(stats.total) || 0,
          together: Number(stats.together) || 0,
          mine: Number(stats.mine) || 0,
        }
      : undefined,
  }
}

export async function getCouple(selfId?: string): Promise<CoupleStatus> {
  const res = await apiFetch("/couple")
  if (res.status === 404) {
    return { linked: false, partner: null, pendingInvite: null }
  }
  if (!res.ok) {
    throw new Error(await readCoupleError(res, "Não foi possível carregar o casal"))
  }
  return normalizeStatus(await res.json(), selfId)
}

export async function createInviteCode(): Promise<PendingInvite> {
  const res = await apiFetch("/couple/invite", { method: "POST" })
  if (!res.ok) {
    throw new Error(await readCoupleError(res, "Não foi possível gerar o código"))
  }
  const invite = normalizeInvite(await res.json())
  if (!invite) throw new Error("Resposta de convite inválida")
  return invite
}

export async function cancelInvite(): Promise<void> {
  const res = await apiFetch("/couple/invite", { method: "DELETE" })
  if (!res.ok) {
    throw new Error(await readCoupleError(res, "Não foi possível cancelar o convite"))
  }
}

export async function acceptInviteCode(
  code: string,
  selfId?: string
): Promise<CoupleStatus> {
  const cleaned = code.trim().toUpperCase()
  if (cleaned.length !== 6) throw new Error("Código inválido")
  const res = await apiFetch("/couple/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: cleaned }),
  })
  if (!res.ok) {
    throw new Error(await readCoupleError(res, "Não foi possível vincular"))
  }
  return normalizeStatus(await res.json(), selfId)
}

export async function unlinkCouple(): Promise<void> {
  const res = await apiFetch("/couple", { method: "DELETE" })
  if (!res.ok) {
    throw new Error(await readCoupleError(res, "Não foi possível remover o vínculo"))
  }
}
