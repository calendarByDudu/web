export type AuthUser = {
  name: string
  email: string
}

type StoredAccount = AuthUser & { password: string }

const USERS_KEY = "cbd-users"
const SESSION_KEY = "cbd-session"

function readUsers(): StoredAccount[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    if (!user?.email || !user?.name) return null
    return user
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function setSession(user: AuthUser) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ name: user.name, email: user.email })
  )
}

export function login(email: string, password: string): AuthUser {
  const normalized = email.trim().toLowerCase()
  const user = readUsers().find((u) => u.email === normalized)
  if (!user || user.password !== password) {
    throw new Error("E-mail ou senha inválidos")
  }
  const session = { name: user.name, email: user.email }
  setSession(session)
  return session
}

export function signup(
  name: string,
  email: string,
  password: string
): AuthUser {
  const normalized = email.trim().toLowerCase()
  const trimmedName = name.trim()
  if (!trimmedName || !normalized || password.length < 4) {
    throw new Error("Preencha nome, e-mail e senha (mín. 4)")
  }
  const users = readUsers()
  if (users.some((u) => u.email === normalized)) {
    throw new Error("Já existe conta com esse e-mail")
  }
  const account: StoredAccount = {
    name: trimmedName,
    email: normalized,
    password,
  }
  writeUsers([...users, account])
  const session = { name: account.name, email: account.email }
  setSession(session)
  return session
}

const RESET_KEY = "cbd-reset"

// ponytail: mock OTP always 123456 — real email later
export function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes("@")) {
    throw new Error("Informe um e-mail válido")
  }
  localStorage.setItem(
    RESET_KEY,
    JSON.stringify({ email: normalized, code: "123456" })
  )
  return normalized
}

export function verifyResetCode(email: string, code: string) {
  const normalized = email.trim().toLowerCase()
  const raw = localStorage.getItem(RESET_KEY)
  if (!raw) throw new Error("Código expirado. Peça outro.")
  let data: { email: string; code: string }
  try {
    data = JSON.parse(raw) as { email: string; code: string }
  } catch {
    throw new Error("Código expirado. Peça outro.")
  }
  if (data.email !== normalized || data.code !== code.trim()) {
    throw new Error("Código inválido")
  }
}

export function resetPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  if (password.length < 4) throw new Error("Senha mín. 4 caracteres")
  const users = readUsers()
  const idx = users.findIndex((u) => u.email === normalized)
  if (idx === -1) throw new Error("Conta não encontrada")
  users[idx] = { ...users[idx], password }
  writeUsers(users)
  localStorage.removeItem(RESET_KEY)
}
