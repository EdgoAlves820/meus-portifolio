# 🏥 Roadmap — o que falta para usar com dados reais em clínicas

Este documento é um **roteiro de evolução**, não uma instrução para colocar pacientes reais na demo atual.

O MeAtende AI, nesta versão, é um **protótipo de front-end**. A interface e os fluxos locais estão disponíveis para demonstração, mas os itens abaixo ainda precisam ser desenvolvidos, integrados e validados antes de qualquer operação clínica real.

## Situação atual

| Área | Situação nesta versão |
|---|---|
| Interface web, painel, agenda e conversas simuladas | ✅ Disponível |
| Persistência local no navegador (`localStorage`) | ✅ Disponível na demo estática |
| Backend, API e banco de dados local/Docker | ✅ Base implementada (Node.js/Express + Prisma + SQLite) |
| Login real e permissões por perfil | ✅ Base implementada (JWT + refresh httpOnly + RBAC) |
| Auditoria de ações | ✅ Base implementada |
| LLM/IA real conectada com segurança | ⬜ Pendente (sandbox) |
| Envio e recebimento real de WhatsApp | ⬜ Pendente (sandbox) |
| Sincronização real de agenda e pagamentos | ⬜ Pendente (sandbox) |
| Conformidade LGPD e homologação clínica | ⬜ Pendente |
| Produção segura (HTTPS, monitoramento, backups, homologação) | ⬜ Pendente |

## Implementado nesta etapa

- Backend local/Docker com API REST, banco SQLite persistente, migrations e seed.
- Autenticação com senha criptografada, access token e refresh token em cookie httpOnly.
- Perfis e permissões no backend: Gestor, Diretor, Gerente, Sócio e Atendente.
- CRUD de pacientes, agendamentos, médicos, tipos de consulta, usuários e configurações.
- Validação de agendamento futuro e conflito de horário.
- Auditoria de ações relevantes.
- Frontend com modo real: login, bootstrap da API e sincronização da agenda.
- Integrações externas registradas em **sandbox**, sem chamadas reais.

## Etapas necessárias

1. **Backend e banco de dados:** a base local/Docker já existe. Para produção, ainda faltam endurecimento, backups operacionais, logs centralizados, controle de acesso organizacional e possível migração para PostgreSQL/gerenciado.
2. **Autenticação e permissões:** a base já existe. Para produção, ainda faltam políticas de senha/MFA, gestão de sessões, recuperação de conta e revisão de permissões por clínica.
3. **IA real:** conectar `js/sophia.js` a um LLM **por meio do backend**, mantendo validações de agenda, regras de segurança e transferência humana. Nunca exponha chaves de API no front-end.
4. **WhatsApp real:** integrar a WhatsApp Cloud API ou provedor adequado no backend, com webhook, envio/recebimento de mensagens e gestão de consentimento. A tela atual não envia mensagens reais.
5. **Agenda e pagamentos reais:** implementar OAuth/sincronização de calendário e criação de cobranças no backend. As telas atuais são demonstrativas.
6. **LGPD e operação clínica:** definir base legal, consentimento, retenção/exclusão, controle de acesso, auditoria, criptografia e revisão jurídica/técnica. Dados de saúde exigem cuidado reforçado.
7. **Produção:** HTTPS, monitoramento, testes de segurança, ambiente de homologação e validação com a clínica antes de qualquer uso real.

## Ordem recomendada de desenvolvimento

1. Definir requisitos da clínica, perfis de acesso e regras de privacidade.
2. Criar backend, banco de dados e autenticação.
3. Migrar a persistência do front-end para a API.
4. Integrar agenda e WhatsApp em ambiente de teste.
5. Conectar o LLM com regras de segurança, limites e transferência humana.
6. Integrar pagamentos, se necessário, com tratamento seguro de credenciais e webhooks.
7. Revisar LGPD, segurança, backups e auditoria.
8. Homologar com dados fictícios ou controlados antes de qualquer uso real.

## Aviso de segurança

> **Não insira tokens, chaves de pagamento ou dados reais de pacientes nos campos da demo.** O `localStorage` não é armazenamento seguro para segredos nem para dados sensíveis.

Concluir este roadmap exige desenvolvimento de backend, integrações, testes e revisão técnica/jurídica. A presença deste documento não significa que esses requisitos já estejam implementados ou que o sistema esteja certificado para uso clínico.

---

Voltar ao [README do projeto](README.md).
