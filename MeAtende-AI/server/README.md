# MeAtende AI — Backend local/Docker

Base real de backend para o MeAtende AI: **Node.js 20 + Express + Prisma + SQLite**, com autenticação, RBAC, auditoria e API REST. O objetivo desta etapa é sair do `localStorage` como única persistência e oferecer um modo real local/Docker, **sem ainda ativar integrações externas reais**.

> **Importante:** isto é uma base local/tecnológica. Não é um sistema clínico homologado para produção. Não use dados reais de pacientes nem credenciais reais de WhatsApp, LLM, calendário ou pagamentos nesta etapa.

## Como rodar

```bash
cd server
cp .env.example .env
npm ci
npx prisma migrate deploy
npm run seed
npm start
```

A API e o frontend ficam em `http://localhost:3000`.

Credenciais iniciais padrão (definidas no `.env`):
- E-mail: `admin@meatende.local`
- Senha: `Troque@123456`

**Troque `ADMIN_PASSWORD`, `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` antes de qualquer uso sério.**

## Docker

Na raiz do projeto:

```bash
cp server/.env.example server/.env
docker compose up --build
```

O banco SQLite fica no volume `meatende-data`.

## Variáveis de ambiente

Veja `server/.env.example`. Principais:

| Variável | Função |
|---|---|
| `PORT` | Porta HTTP do backend. |
| `DATABASE_URL` | SQLite local (`file:./dev.db`) ou Docker (`file:/data/meatende.db`). |
| `JWT_ACCESS_SECRET` | Segredo do access token. |
| `JWT_REFRESH_SECRET` | Segredo/ambiente de refresh. |
| `ACCESS_TOKEN_TTL` | Validade do access token (ex.: `15m`). |
| `REFRESH_TOKEN_DAYS` | Validade do refresh token. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Administrador criado pelo seed. |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula. |
| `COOKIE_SECURE` | `true` quando atrás de HTTPS. |
| `PUBLIC_DIR` | Pasta do frontend servida pelo backend. |

## Perfis e permissões (RBAC)

| Perfil | Resumo |
|---|---|
| `GESTOR` | Acesso total. |
| `DIRETOR` | Gestão ampla, usuários, auditoria, integrações e configurações. |
| `GERENTE` | Pacientes, agenda, catálogo e leitura de configurações/métricas. |
| `SOCIO` | Leitura de pacientes, agenda, métricas e auditoria. |
| `ATENDENTE` | Pacientes e agenda operacionais, sem gestão de usuários/configurações. |

As permissões são aplicadas **no backend**, não apenas na interface.

## Endpoints principais

### Saúde e sessão
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Carga inicial
- `GET /api/bootstrap` — clínica, usuário, permissões, catálogo, pacientes/agenda conforme perfil, integrações e auditoria recente.

### Usuários
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id` (desativa)

### Pacientes
- `GET /api/patients?q=...`
- `POST /api/patients`
- `PATCH /api/patients/:id`
- `DELETE /api/patients/:id`

### Agenda
- `GET /api/appointments?date=YYYY-MM-DD&from=...&to=...&status=...`
- `POST /api/appointments`
- `PATCH /api/appointments/:id`
- `DELETE /api/appointments/:id`

Regras: não aceita agendamento no passado; exige antecedência mínima de 30 minutos; bloqueia conflito de horário.

### Catálogo
- `GET/POST/PATCH/DELETE /api/doctors`
- `GET/POST/PATCH/DELETE /api/appt-types`

### Configurações, integrações, auditoria e métricas
- `GET/PATCH /api/settings`
- `GET /api/integrations`
- `PATCH /api/integrations/:provider`
- `POST /api/integrations/:provider/test`
- `GET /api/audit`
- `GET /api/metrics?days=90`

Provedores de integração: `whatsapp`, `llm`, `google_calendar`, `payments`, `crm`, `webhook`. Todos operam em **sandbox** nesta etapa.

## Testes

```bash
cd server
npm test
```

Os testes cobrem saúde, login inválido, autenticação obrigatória, RBAC, criação de paciente/agendamento, bloqueio de horário passado e auditoria.

## Segurança implementada nesta base

- Senhas com hash bcrypt.
- Access token curto + refresh token rotativo em cookie httpOnly.
- RBAC por perfil no backend.
- Validação de entrada com Zod.
- Helmet, CORS configurável e rate limit no login.
- Auditoria de ações relevantes.
- Escopo por clínica (`clinicId`) nas consultas.
- `.env`, bancos locais e `node_modules` fora do Git.

## Limitações conscientes

- SQLite é adequado para base local/pequena operação; para produção multiusuário/escala, avalie PostgreSQL/gerenciado.
- Não há MFA, recuperação de senha, SSO ou gestão organizacional avançada.
- Não há WhatsApp real, LLM real, Google Agenda real ou pagamentos reais.
- Não há certificação LGPD, homologação clínica, backups operacionais, monitoramento ou implantação production-grade.
- O frontend ainda mantém módulos de demonstração; a agenda é o fluxo sincronizado com a API nesta etapa.

## Próximos passos

Consulte o [`ROADMAP.md`](../ROADMAP.md) na raiz do projeto.
