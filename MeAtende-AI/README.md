# 💚 MeAtende AI

**Protótipo funcional de atendimento para clínicas — IA simulada + atendimento humano, em uma interface web responsiva.**

A proposta é demonstrar como uma clínica poderia centralizar o atendimento: a assistente virtual **Sophia** responde, orienta e agenda; quando necessário, a conversa passa para uma pessoa da equipe. O projeto inclui painel de gestão, agenda, fila, funil, relatórios e configurações.

> **Status do projeto:** o MeAtende AI agora tem **dois modos**:
>
> 1. **Demo estática** — para portfólio, GitHub Pages e arquivo único (`MeAtendeAI.html`). Usa dados fictícios no navegador.
> 2. **Real local/Docker** — backend Node.js/Express + banco SQLite persistente + login, perfis/permissões, API, auditoria e sincronização da agenda.
>
> **Ainda não está pronto para operação clínica real em produção.** As integrações externas (WhatsApp, LLM, calendário, pagamentos) permanecem em **sandbox**, e os requisitos de LGPD, segurança, homologação e produção ainda precisam ser concluídos. **Não cadastre dados reais de pacientes nem credenciais reais de serviços externos nesta versão.**

📌 **Planejamento para produção:** o que ainda precisa ser desenvolvido está detalhado em [`ROADMAP.md`](ROADMAP.md). Esse documento é um roteiro de evolução, não uma lista de recursos já implementados.

![Prévia do painel MeAtende AI](assets/preview.png)

---

## 🚀 Como executar

### Opção 1 — arquivo único, sem instalar nada
Abra **`MeAtendeAI.html`** com duplo clique. HTML, CSS, JavaScript e fonte já estão embutidos; funciona no navegador sem servidor e sem internet.

### Opção 2 — versão em pastas, para desenvolver
O `index.html` usa ES Modules e precisa ser servido por HTTP. Na **raiz do projeto** (a pasta que contém `index.html`):

```bash
# Python 3
python3 -m http.server 3000

# No Windows, se o comando acima não existir:
py -m http.server 3000
```

Depois abra **http://localhost:3000**.

Alternativa com Node.js (baixa o servidor `serve` na primeira execução):

```bash
npx --yes serve . -l 3000
```

Não abra o `index.html` diretamente com `file://`; para esse uso, abra o `MeAtendeAI.html`.

### Gerar novamente o arquivo único
Requer **Node.js 18+**. Na raiz do projeto:

```bash
npm ci
npm run build
```

O comando gera/atualiza **`MeAtendeAI.html`**. O `esbuild` é usado apenas como ferramenta de build; a demo estática não depende de bibliotecas externas nem de CDN.

---

## 🔐 Modo real local/Docker (backend + login + banco)

O modo real adiciona uma API com autenticação, permissões por perfil, auditoria e persistência em banco. Ele **não** ativa WhatsApp/IA/pagamentos reais: esses provedores ficam em sandbox até serem configurados em uma etapa futura.

### Rodar localmente com Node.js 20+

```bash
cd server
cp .env.example .env       # ajuste segredos e senha do admin
npm ci
npx prisma migrate deploy
npm run seed
npm start
```

Abra **http://localhost:3000**. O login inicial usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no `.env` (padrão local: `admin@meatende.local` / `Troque@123456`). **Troque a senha e os segredos antes de qualquer uso sério.**

### Rodar com Docker

```bash
cp server/.env.example server/.env   # ajuste segredos e senha
docker compose up --build
```

Abra **http://localhost:3000**. O banco fica em um volume persistente (`meatende-data`).

### O que o modo real já faz
- Login com senha criptografada, access token curto e refresh token em cookie httpOnly.
- Perfis: **Gestor, Diretor, Gerente, Sócio e Atendente**, com permissões aplicadas no backend.
- CRUD de pacientes, agendamentos, médicos, tipos de consulta, usuários e configurações.
- Agenda com validação de horário futuro e conflito de horário.
- Auditoria de ações relevantes.
- Sincronização da agenda do frontend com a API.
- Integrações externas registradas como **sandbox**, sem chamadas reais.

### O que o modo real ainda NÃO faz
- Não envia WhatsApp real, não conecta LLM real, não sincroniza Google Agenda real e não processa pagamentos reais.
- Não substitui revisão LGPD, controle de acesso organizacional, backups operacionais, monitoramento, homologação clínica ou implantação segura em produção.

Mais detalhes em [`server/README.md`](server/README.md) e no [`ROADMAP.md`](ROADMAP.md).

---

## 📁 Estrutura

```text
meatende-ai/
├── index.html              # Entrada da versão em módulos (servir por HTTP)
├── MeAtendeAI.html         # Versão única autocontida (duplo clique)
├── build-standalone.cjs    # Gera a versão única
├── package.json            # Script de build + dependência de desenvolvimento
├── package-lock.json       # Versões travadas para build reprodutível
├── .gitignore              # Ignora node_modules, segredos e arquivos locais
├── README.md               # Instruções, funcionalidades e limitações
├── ROADMAP.md              # O que falta para uso real em clínicas
├── LICENSE                 # Licença proprietária do código
├── Dockerfile              # Imagem do modo real (backend + frontend)
├── docker-compose.yml      # Sobe o modo real com volume persistente
├── server/                 # API Node.js/Express + Prisma + SQLite
│   ├── src/                # Rotas, autenticação, RBAC, auditoria
│   ├── prisma/             # Schema, migrations e seed
│   └── tests/              # Testes de API/RBAC
├── assets/
│   ├── favicon.svg
│   ├── preview.png         # Imagem de prévia deste README
│   └── fonts/              # Plus Jakarta Sans + licença OFL
├── css/                    # Tokens, layout, componentes, páginas, tema e responsivo
└── js/
    ├── app.js              # Boot, navegação, topbar, notificações, tema, som e perfis
    ├── i18n.js             # PT/EN/ES/FR + moeda e câmbio configurável
    ├── store.js            # Estado, dados fictícios e persistência local
    ├── sophia.js           # Motor de regras da Sophia + agendamento
    ├── sound.js            # Sons via Web Audio, com liga/desliga
    ├── charts.js           # Gráficos SVG
    ├── ui.js / utils.js / icons.js / content.js
    └── pages/              # 11 módulos da aplicação
```

---

## ✨ O que a demonstração inclui

| Área | Comportamento |
|---|---|
| **Painel** | KPIs, atividade simulada, saúde da fila e faturamento com períodos de **3 dias, 7 dias, 15 dias, 1 mês, 3 meses, 6 meses, 1 ano e 5 anos**. |
| **WhatsApp & Sophia** | Conversa simulada: detecção de intenção por regras, respostas no idioma ativo, oferta de horários futuros e criação de agendamento local. |
| **IA + humano** | Assumir/devolver conversa, compositor humano, respostas rápidas e retomada da Sophia. |
| **Agendamento** | Horários baseados no relógio do dispositivo, antecedência mínima de 30 min para o mesmo dia, validação de conflitos e datas em **dd/mm/aaaa**. |
| **Fila / SLA** | Contagem regressiva, estados de prazo, alertas e prioridade. |
| **Agenda** | Visões semanal/diária, navegação por data, tipos de consulta e horários de funcionamento. |
| **Funil** | Kanban com arrastar/soltar e movimentação simulada pela Sophia. |
| **Relatórios** | Períodos de 7/30/90 dias, gráficos e exportação CSV dos dados locais. |
| **Configurações** | Perfil da clínica, playbook, piloto automático, simulador, respostas rápidas e **câmbio editável**. |
| **Idiomas e moeda** | PT/EN/ES/FR; valores base em BRL convertidos para USD/EUR conforme o idioma e as taxas definidas. |
| **Tema e som** | Claro/escuro e interruptor de som, com preferências persistidas. |
| **Perfis de acesso** | Seletor visual de Gestor, Sócio(a), Gerente e Diretor(a). **Não é controle de permissões/autenticação.** |
| **Notificações** | Sino com badge numérico completo, posicionado para fora do botão, dropdown e navegação ao contexto. |
| **Integrações** | Telas demonstrativas de WhatsApp, Google Agenda, pagamentos, CRM e webhooks. **Não conectam nem processam serviços reais nesta versão.** |

### Detalhes importantes
- **Câmbio:** em *Configurações → Perfil → Câmbio da moeda*, defina quanto **1 BRL** vale em USD e EUR. Os valores são convertidos apenas para exibição; não há consulta de cotação online.
- **Agendamento em tempo real:** a Sophia não oferece horários já passados do dia atual nem datas passadas. A referência de horário é o relógio do dispositivo/navegador.
- **Simulação ao vivo:** o sistema gera eventos periódicos para demonstrar a operação. Pode ser pausada no botão **Piloto automático**.
- **Persistência:** o estado fica no `localStorage`. Para voltar aos dados fictícios iniciais: **Configurações → Perfil → Reiniciar demo**.
- **Segurança da IA:** as regras exibidas (LGPD, não diagnosticar, emergência → SAMU 192, transferência humana etc.) fazem parte da simulação. **Não equivalem a certificação ou conformidade legal.**

---

## 🌐 Publicar no GitHub e no GitHub Pages

### 1. Enviar o projeto ao GitHub
Crie um repositório **vazio** na sua conta (sem README, `.gitignore` ou licença inicial, para evitar conflito). Depois, na pasta extraída do projeto:

```bash
git init
git add .
git commit -m "feat: versão inicial do MeAtende AI"
git branch -M main
git remote add origin https://github.com/DevFeraBoy820/NOME-DO-REPOSITORIO.git
git push -u origin main
```

Substitua `NOME-DO-REPOSITORIO` pelo nome real do repositório. Se o remoto `origin` já existir, use `git remote set-url origin URL_DO_REPOSITORIO` em vez de `git remote add`.

### 2. Ativar o GitHub Pages
No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` → pasta `/ (root)` → Save**.

A demo ficará em um endereço parecido com:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

O projeto usa caminhos relativos e navegação por hash, adequados a esse tipo de hospedagem estática. O GitHub Pages publica a **demonstração**, não transforma o projeto em um sistema clínico de produção.

---

## 🏥 O que falta para usar com dados reais em clínicas

Esta seção é um **roteiro de evolução**, não uma instrução para colocar pacientes reais na demo atual.

Para consultar o checklist, a situação de cada área e a ordem recomendada de desenvolvimento, veja também [`ROADMAP.md`](ROADMAP.md).

1. **Backend e banco de dados:** criar API, persistência segura, backups, logs e controle de acesso. Substituir as leituras/escritas de `js/store.js` por chamadas autenticadas ao backend.
2. **Autenticação e permissões:** implementar login real e regras por perfil. O seletor atual é apenas visual.
3. **IA real:** conectar `js/sophia.js` a um LLM **por meio do backend**, mantendo validações de agenda, regras de segurança e transferência humana. Nunca exponha chaves de API no front-end.
4. **WhatsApp real:** integrar a WhatsApp Cloud API ou provedor adequado no backend, com webhook, envio/recebimento de mensagens e gestão de consentimento. A tela atual não envia mensagens reais.
5. **Agenda e pagamentos reais:** implementar OAuth/sincronização de calendário e criação de cobranças no backend. As telas atuais são demonstrativas.
6. **LGPD e operação clínica:** definir base legal, consentimento, retenção/exclusão, controle de acesso, auditoria, criptografia e revisão jurídica/técnica. Dados de saúde exigem cuidado reforçado.
7. **Produção:** HTTPS, monitoramento, testes de segurança, ambiente de homologação e validação com a clínica antes de qualquer uso real.

> **Não insira tokens, chaves de pagamento ou dados reais de pacientes nos campos da demo.** O `localStorage` não é armazenamento seguro para segredos nem para dados sensíveis.

---

## ✅ Verificações realizadas nesta entrega

- Build do arquivo único concluído sem erro.
- Fluxos principais de navegação, Sophia, agenda, pagamentos simulados, perfis, tema, som e câmbio verificados em navegador.
- Layout conferido em **390, 768 e 1024 px**, sem overflow horizontal nas telas verificadas.
- Carregamento da demo sem requisições externas e sem erros de JavaScript nos fluxos testados.
- Badge do sino conferido nos modos claro e escuro.
- Backend: testes de API/RBAC/agenda/auditoria passando.
- Modo real: login, bootstrap, criação de agendamento pela UI e persistência na API verificados.
- Demo estática preservada: GitHub Pages/arquivo único continuam funcionando sem backend.

Essas verificações são de interface/funcionamento local; não substituem testes de segurança, backend, integrações reais ou homologação clínica.

---

## 📄 Licença e créditos de terceiros

- **Código do projeto:** **licença proprietária — todos os direitos reservados** a DevFeraBoy820. O código é público para portfólio e avaliação, mas **não pode ser copiado, modificado, distribuído, usado ou vendido sem autorização prévia e por escrito do autor**. Veja o arquivo [`LICENSE`](LICENSE).
- **Fonte Plus Jakarta Sans:** SIL Open Font License 1.1. Texto integral em [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt).

---

## 👨‍💻 Autor

Criado e desenvolvido por **[DevFeraBoy820](https://github.com/DevFeraBoy820)**.
