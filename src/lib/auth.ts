export type AuthUser = {
  id: string
  name: string
  email: string
  coupleId?: string | null
}

const TOKEN_KEY = "cbd-token"
const REFRESH_TOKEN_KEY = "cbd-refresh-token"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1"

type ApiErrorBody = {
  error?: { code?: string; message?: string }
}

function apiUrl(path: string) {
  return `${API_URL.replace(/\/$/, "")}${path}`
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody
    if (body.error?.message) return body.error.message
  } catch {
    // ignore non-JSON
  }
  return "Algo deu errado"
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function setTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

/** user id = JWT `sub` (mesmo valor de createdById na API) */
export function getSessionUserId(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const data = JSON.parse(json) as { sub?: unknown }
    return typeof data.sub === "string" && data.sub ? data.sub : null
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasSession(): boolean {
  return Boolean(getToken())
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  const res = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return false

  const data = (await res.json()) as {
    accessToken?: string
    refreshToken?: string
  }
  if (!data.accessToken) return false

  setTokens(data.accessToken, data.refreshToken ?? refreshToken)
  return true
}

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** Fetch autenticado: 401 → refresh uma vez → retry. */
export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(apiUrl(path), { ...init, headers })
  if (res.status !== 401) return res

  const refreshed = await refreshOnce()
  if (!refreshed) {
    clearSession()
    return res
  }

  const retryHeaders = new Headers(init.headers)
  const next = getToken()
  if (next) retryHeaders.set("Authorization", `Bearer ${next}`)
  return fetch(apiUrl(path), { ...init, headers: retryHeaders })
}

export async function fetchMe(): Promise<AuthUser> {
  if (!getToken() && !getRefreshToken()) throw new Error("Sem sessão")

  const res = await apiFetch("/auth/me")
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
  const body = (await res.json()) as {
    id?: string
    userId?: string
    name?: string
    email?: string
    coupleId?: string | null
  }
  const id =
    getSessionUserId() ??
    (typeof body.id === "string" ? body.id : null) ??
    (typeof body.userId === "string" ? body.userId : null)
  if (!id || !body.email || !body.name) {
    throw new Error("Perfil inválido")
  }
  return {
    id,
    name: body.name,
    email: body.email,
    coupleId: typeof body.coupleId === "string" ? body.coupleId : null,
  }
}

/** Boot: tokens locais → /me (com refresh se access expirou). */
export async function restoreSession(): Promise<AuthUser | null> {
  if (!getToken() && !getRefreshToken()) return null
  try {
    return await fetchMe()
  } catch {
    clearSession()
    return null
  }
}

async function acceptTokensAndFetchMe(data: {
  accessToken?: string
  refreshToken?: string
}): Promise<AuthUser> {
  if (!data.accessToken || !data.refreshToken) {
    throw new Error("Resposta de auth inválida")
  }
  setTokens(data.accessToken, data.refreshToken)
  return fetchMe()
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
  return acceptTokensAndFetchMe(
    (await res.json()) as {
      accessToken?: string
      refreshToken?: string
    }
  )
}

export async function signup(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(apiUrl("/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
  return acceptTokensAndFetchMe(
    (await res.json()) as {
      accessToken?: string
      refreshToken?: string
    }
  )
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes("@")) {
    throw new Error("Informe um e-mail válido")
  }
  const res = await fetch(apiUrl("/auth/password/forgot"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalized }),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
  return normalized
}

export async function verifyResetCode(email: string, code: string) {
  const normalized = email.trim().toLowerCase()
  const trimmed = code.trim()
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("Código inválido")
  }
  const res = await fetch(apiUrl("/auth/password/verify-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalized, code: trimmed }),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
}

export async function resetPassword(
  email: string,
  code: string,
  password: string
) {
  const normalized = email.trim().toLowerCase()
  const trimmed = code.trim()
  if (password.length < 4) throw new Error("Senha mín. 4 caracteres")
  if (!/^\d{6}$/.test(trimmed)) throw new Error("Código inválido")

  const res = await fetch(apiUrl("/auth/password/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: normalized,
      code: trimmed,
      password,
    }),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res))
  }
}
