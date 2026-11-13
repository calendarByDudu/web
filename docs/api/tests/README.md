# Testes de API — calendarByDudu

Direção dos testes de contrato a partir de [`../openapi.json`](../openapi.json).  
Este doc **não** implementa testes; define o que escrever quando o backend (ou mock) existir.

## Fonte da verdade

- Contrato: `docs/api/openapi.json` (OpenAPI 3.1, schemas **inline**, sem `$ref`)
- Base URL local: `http://localhost:3001/v1`
- Auth: `Authorization: Bearer <accessToken>`

## Stack sugerida (quando for implementar)

| Peça | Uso |
|------|-----|
| Vitest | Runner |
| `fetch` ou `supertest` | HTTP |
| Prism (opcional) | Mock server a partir do OpenAPI |
| Schemathesis (opcional) | Fuzz/contrato automático |

Ainda **não** há runner de teste no `package.json` do front. Os testes de API podem viver:

- no repo do **backend**, ou
- em `tests/api/` neste monorepo quando o server existir

## Princípios

1. Cada `operationId` do OpenAPI vira pelo menos 1 caso feliz.
2. Cada status de erro documentado (400/401/403/404/409) vira caso negativo quando fizer sentido.
3. Assert: status HTTP + campos `required` do schema de resposta.
4. Mensagens de erro: shape `{ error: { code, message } }` com `message` em pt-BR.
5. Não inventar endpoints fora do OpenAPI.

## Ordem de execução

Fluxos dependem de sessão. Rodar nesta ordem (ou com fixtures isoladas):

1. **Auth** — criar usuário, login, me, logout; reset de senha
2. **Couple** — convite, aceite, status, unlink
3. **Events** — CRUD + permissão de criador

---

## 1. Auth

| operationId | Método | Path | Casos |
|-------------|--------|------|-------|
| `signup` | POST | `/auth/signup` | 201 + `accessToken` + `user`; 400 validação; 409 e-mail duplicado |
| `login` | POST | `/auth/login` | 200 tokens; 400 vazio; 401 credencial inválida |
| `logout` | POST | `/auth/logout` | 204 com Bearer; 401 sem token |
| `getMe` | GET | `/auth/me` | 200 `id/name/email`; 401 |
| `forgotPassword` | POST | `/auth/password/forgot` | 204 (mesmo se e-mail não existir — não vazar); 400 e-mail inválido |
| `verifyPasswordOtp` | POST | `/auth/password/verify-otp` | 204 OTP ok; 401 inválido/expirado |
| `resetPassword` | POST | `/auth/password/reset` | 204; 401 OTP ruim; 404 conta |

### Fluxo sugerido

```
signup(A) → getMe → logout → login(A) → forgot → verify-otp → reset → login(nova senha)
```

### Assert mínimo — `AuthTokens`

- `accessToken`: string não vazia
- `user.id`: uuid
- `user.name`, `user.email`: string

---

## 2. Couple

| operationId | Método | Path | Casos |
|-------------|--------|------|-------|
| `getCouple` | GET | `/couple` | 200 `linked` false sem vínculo; true + `partner` após aceite |
| `createCoupleInvite` | POST | `/couple/invites` | 200 código 6 chars; idempotente se já pendente; 409 se já linked |
| `cancelCoupleInvite` | DELETE | `/couple/invites` | 204 |
| `acceptCoupleInvite` | POST | `/couple/invites/accept` | 200 linked; 404 código; 409 próprio código / já linked |
| `unlinkCouple` | DELETE | `/couple` | 204; 404 sem vínculo |

### Fluxo sugerido

```
signup(A) → signup(B)
A: createCoupleInvite → code
B: acceptCoupleInvite(code)
A e B: getCouple → linked true, partner preenchido
A: unlinkCouple → ambos linked false
```

### Assert mínimo — convite

- `code`: 6 chars no padrão `[A-HJ-NP-Z2-9]{6}`
- `createdAt`, `expiresAt`: date-time

### Assert mínimo — stats (quando linked)

- `stats.total`, `stats.together`, `stats.mine`: integer ≥ 0

---

## 3. Events

| operationId | Método | Path | Casos |
|-------------|--------|------|-------|
| `listEvents` | GET | `/events` | 200 `items[]`; filtro `audience`; `from`/`to` |
| `createEvent` | POST | `/events` | 201; `createdBy` = e-mail do token; 400 sem title |
| `getEvent` | GET | `/events/{eventId}` | 200; 404; 403 se não visível |
| `updateEvent` | PATCH | `/events/{eventId}` | 200 só criador; 403 outro usuário |
| `deleteEvent` | DELETE | `/events/{eventId}` | 204 só criador; 403 outro |

### Regras de visão (espelhar no teste)

- `audience: "me"` → só o criador lista/vê
- `audience: "couple"` → ambos do vínculo veem
- PATCH/DELETE → só `createdBy` do evento

### Fluxo sugerido

```
signup(A) + signup(B) + vínculo
A cria event couple → B lista e vê; B tenta PATCH → 403
A cria event me → B list(audience=me) não inclui; A vê
A PATCH/DELETE → 200/204
```

### Assert mínimo — `Event`

Campos required: `id`, `title`, `startsAt`, `audience`, `category`, `color`, `createdBy`, `createdAt`, `updatedAt`

Enums:

- `audience`: `me` | `couple`
- `category`: `saidinha` | `restaurante` | `aniversario` | `saude` | `trabalho` | `casa` | `viagem` | `outro`
- `color`: `blue` | `green` | `amber` | `rose` | `violet`

Datas de evento: ISO **local** `yyyy-MM-ddTHH:mm:ss` (sem timezone), igual ao front.

---

## Erros

Todo body de erro documentado:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "E-mail ou senha inválidos"
  }
}
```

Códigos de exemplo no OpenAPI: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_CREDENTIALS`, `INVALID_OTP`, `OTP_EXPIRED`, `ALREADY_LINKED`, `INVITE_NOT_FOUND`, `OWN_INVITE`.

---

## Checklist antes de marcar “pronto”

- [ ] Prism ou backend sobe e responde `/v1`
- [ ] Suite Auth verde
- [ ] Suite Couple verde (dois usuários)
- [ ] Suite Events verde (CRUD + 403 de não-criador)
- [ ] Nenhum path fora do OpenAPI
- [ ] Schema required validado nos 200/201

## Próximo passo (implementação)

1. Escolher onde rodam os testes (repo backend vs `tests/api/` aqui)
2. Adicionar Vitest + script `test:api`
3. Criar `auth.contract.test.ts`, `couple.contract.test.ts`, `events.contract.test.ts`
4. Opcional: gerar cases extras com Schemathesis a partir do mesmo OpenAPI
