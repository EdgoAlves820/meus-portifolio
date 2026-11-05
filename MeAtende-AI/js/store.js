/* =====================================================================
   MeAtende AI — store.js
   Estado central + dados semente (demo clínica) + persistência.
   ===================================================================== */
import { uid, storage, bus, dateKey, addDays, seededRandom } from './utils.js';

export const SLA_SECONDS = 15 * 60;

/* Horários oficiais da clínica (pedido do cliente) */
export const HOURS = {
  0: null,                                  // Domingo: fechado
  1: { open: '07:00', close: '16:30' },
  2: { open: '07:00', close: '16:30' },
  3: { open: '07:00', close: '16:30' },
  4: { open: '07:00', close: '16:30' },
  5: { open: '07:00', close: '16:30' },
  6: { open: '08:00', close: '13:00' }
};

export const DEFAULT_PROMPT = `Você é a Sophia, atendente virtual empática, ágil e profissional da Clínica Vida Plena. Seu objetivo é esclarecer dúvidas sobre especialidades e serviços e agendar consultas nos horários disponíveis.

Horários: Segunda a Sexta 07h00–16h30 · Sábado 08h00–13h00 · Domingo fechado. Você responde 24h, mas só agenda dentro do horário de funcionamento.

A clínica oferece: odontologia, oftalmologia, dermatologia, clínica geral, cardiologia, ginecologia, pediatria, ortopedia, otorrinolaringologia, endocrinologia, gastroenterologia, urologia, psicologia, psiquiatria, nutrição e fisioterapia.

Responda com clareza e cordialidade. Nunca dê diagnósticos ou prescreva medicamentos — oriente avaliação presencial. Ao agendar, confirme especialidade, nome do paciente e horário. Escale para humano: urgências, reclamações, descontos acima de 15% e convênios não cadastrados.`;

export const SPECIALTIES = ['Odontologia', 'Oftalmologia', 'Dermatologia', 'Clínica Geral', 'Cardiologia', 'Ginecologia', 'Pediatria', 'Ortopedia', 'Otorrinolaringologia', 'Endocrinologia', 'Gastroenterologia', 'Urologia', 'Psicologia', 'Psiquiatria', 'Nutrição', 'Fisioterapia', 'Neurologia', 'Reumatologia', 'Pneumologia', 'Nefrologia', 'Geriatria', 'Alergologia e Imunologia'];

export const DOCTORS = [
  { id: 'd1', name: 'Dr. Carlos Eduardo', spec: 'Cardiologia / Dermatologia' },
  { id: 'd2', name: 'Dra. Juliana Paes', spec: 'Odontologia' },
  { id: 'd3', name: 'Dra. Renata Vieira', spec: 'Clínica Geral / Pediatria' },
  { id: 'd4', name: 'Dr. André Matos', spec: 'Ortopedia / Fisioterapia' },
  { id: 'd5', name: 'Dra. Paula Nunes', spec: 'Nutrição / Endocrinologia' },
  { id: 'd6', name: 'Dra. Fernanda Lopes', spec: 'Neurologia' },
  { id: 'd7', name: 'Dr. Ricardo Salles', spec: 'Reumatologia / Geriatria' },
  { id: 'd8', name: 'Dra. Beatriz Andrade', spec: 'Pneumologia / Alergologia e Imunologia' },
  { id: 'd9', name: 'Dr. Marcelo Tavares', spec: 'Nefrologia / Urologia' },
  { id: 'd10', name: 'Dra. Sofia Almeida', spec: 'Ginecologia / Obstetrícia' },
  { id: 'd11', name: 'Dr. Henrique Prado', spec: 'Gastroenterologia / Endocrinologia' },
  { id: 'd12', name: 'Dra. Letícia Moraes', spec: 'Oftalmologia / Otorrinolaringologia' }
];

const now = Date.now();
const today = new Date();
const tk = dateKey(today);

function seedAppointments() {
  const list = [];
  const base = [
    { off: 0, time: '07:30', patient: 'Pedro Santos', doctor: 'd3', type: 't3', status: 'done' },
    { off: 0, time: '09:00', patient: 'Mariana Costa', doctor: 'd1', type: 't2', status: 'confirmed' },
    { off: 0, time: '11:30', patient: 'Lucas Mendes', doctor: 'd2', type: 't1', status: 'confirmed' },
    { off: 0, time: '14:00', patient: 'Beatriz Ramos', doctor: 'd1', type: 't4', status: 'pending' },
    { off: 0, time: '15:30', patient: 'Camila Nogueira', doctor: 'd4', type: 't6', status: 'confirmed' },
    { off: 1, time: '10:00', patient: 'Beatriz Ramos', doctor: 'd1', type: 't4', status: 'confirmed' },
    { off: 1, time: '08:00', patient: 'João Pedro Reis', doctor: 'd3', type: 't3', status: 'confirmed' },
    { off: 2, time: '14:00', patient: 'Gabriel Alves', doctor: 'd4', type: 't5', status: 'pending' },
    { off: 2, time: '09:30', patient: 'Fernanda Dias', doctor: 'd5', type: 't7', status: 'confirmed' },
    { off: 3, time: '11:00', patient: 'Rafael Torres', doctor: 'd2', type: 't1', status: 'confirmed' },
    { off: 4, time: '13:30', patient: 'Larissa Prado', doctor: 'd1', type: 't2', status: 'pending' }
  ];
  base.forEach(b => {
    const d = addDays(today, b.off);
    const dow = d.getDay();
    if (dow === 0) return; // domingo fechado
    let time = b.time;
    if (dow === 6 && time >= '13:00') time = '09:00';
    list.push({ id: uid(), date: dateKey(d), time, duration: 45, patient: b.patient, doctor: b.doctor, type: b.type, status: b.status, source: 'sophia' });
  });
  return list;
}

function seedChats() {
  const m = (sender, text, minAgo, extra = {}) => ({ id: uid(), sender, text, ts: now - minAgo * 60000, ...extra });
  return [
    {
      id: 'c1', name: 'Ana Beatriz', phone: '+55 11 98877-6655', mode: 'ai', status: 'active', unread: 0,
      stage: 'scheduled', intent: 'Agendamento — Odontologia', tags: ['Odontologia', 'Primeira consulta'],
      messages: [
        m('user', 'Olá, gostaria de saber se vocês têm atendimento odontológico e cardiologia?', 34),
        m('sophia', 'Olá, Ana Beatriz! 👋 Sou a Sophia, assistente da Clínica Vida Plena. Sim! Temos especialistas em Odontologia e Cardiologia, além de outras 14 áreas. Deseja agendar uma avaliação para qual delas?', 33),
        m('user', 'Odontologia, por favor. Pode ser hoje à tarde?', 31),
        m('sophia', 'Perfeito! Hoje tenho 14h30 e 15h45 com a Dra. Juliana Paes. A avaliação odontológica é R$ 180 com retorno incluso. Qual horário prefere?', 30),
        m('user', 'Pode ser 14h30!', 28),
        m('sophia', 'Agendado! ✅ Odontologia com a Dra. Juliana Paes, hoje às 14h30. Enviarei um lembrete 1h antes. Posso ajudar em algo mais?', 27, { kind: 'booking', data: { type: 'Odontologia', time: '14:30', doctor: 'Dra. Juliana Paes', value: 180 } })
      ]
    },
    {
      id: 'c2', name: 'Lucas Mendes', phone: '+55 21 97654-3210', mode: 'ai', status: 'active', unread: 2,
      stage: 'qualified', intent: 'Preço — Limpeza dental', tags: ['Odontologia', 'Preço'],
      messages: [
        m('user', 'Queria saber o preço da limpeza dentária.', 12),
        m('sophia', 'Olá, Lucas! Nossa limpeza dentária + avaliação sai a partir de R$ 150, com retorno incluso. 😊 Quer que eu verifique os horários desta semana?', 11),
        m('user', 'Quero sim, de preferência amanhã cedo', 4)
      ]
    },
    {
      id: 'c3', name: 'Carla Souza', phone: '+55 31 99123-4567', mode: 'human', status: 'needs', unread: 1,
      stage: 'qualified', intent: 'Convênio + desconto especial', tags: ['Dermatologia', 'Convênio'],
      messages: [
        m('user', 'Estou com uma dúvida sobre desconto em pacote dermatológico e plano de saúde.', 9),
        m('sophia', 'Entendi, Carla! Para condições especiais de pacotes e convênios, vou transferir você para nossa equipe humana, que consegue negociar a melhor condição. Um momento, por favor. 🙏', 8),
        m('system', 'Sophia transferiu a conversa para atendimento humano (confiança 46% — regra: convênios e descontos >15%).', 8)
      ]
    },
    {
      id: 'c4', name: 'Fernando Lima', phone: '+55 41 98822-1144', mode: 'ai', status: 'active', unread: 0,
      stage: 'lead', intent: 'Informação — Nutrição', tags: ['Nutrição'],
      messages: [
        m('user', 'Quais dias a nutricionista atende?', 18),
        m('sophia', 'Olá, Fernando! A Dra. Paula Nunes (Nutrição) atende de segunda a sexta, 07h–16h30, e sábado 08h–13h. A consulta é R$ 220 com plano alimentar. Qual dia fica melhor para você?', 17)
      ]
    },
    {
      id: 'c5', name: 'Mariana Costa', phone: '+55 79 99911-2233', mode: 'ai', status: 'active', unread: 0,
      stage: 'confirmed', intent: 'Confirmação de consulta', tags: ['Dermatologia', 'Retorno'],
      messages: [
        m('sophia', 'Oi, Mariana! Passando para confirmar sua consulta de Dermatologia hoje às 09h00 com o Dr. Carlos Eduardo. Podemos confirmar? ✅', 95),
        m('user', 'Confirmado! Estarei aí.', 90),
        m('sophia', 'Maravilha! Consulta confirmada. Chegue com 10 minutinhos de antecedência, por favor. Até logo! 💚', 89)
      ]
    },
    {
      id: 'c6', name: 'Roberto Alves', phone: '+55 85 98765-0011', mode: 'human', status: 'needs', unread: 3,
      stage: 'lead', intent: 'Reclamação — cobrança', tags: ['Financeiro', 'Urgente'],
      messages: [
        m('user', 'Fui cobrado duas vezes pela consulta de ontem. Quero resolver isso hoje.', 22),
        m('sophia', 'Sinto muito pelo transtorno, Roberto. Cobranças em duplicidade são tratadas pela nossa equipe financeira com prioridade. Já estou chamando um atendente humano. 🙏', 21),
        m('system', 'Escalonado automaticamente: assunto financeiro sensível (regra do playbook).', 21),
        m('user', 'Aguardo. Preciso do estorno ainda hoje.', 19)
      ]
    }
  ];
}

function seedQueue() {
  return [
    { id: 'q1', chatId: 'c1', name: 'Ana Beatriz', type: 'Odontologia', priority: 'medium', status: 'in_service', seconds: 760, alerted: false },
    { id: 'q2', chatId: 'c2', name: 'Lucas Mendes', type: 'Odontologia', priority: 'medium', status: 'waiting', seconds: 340, alerted: false },
    { id: 'q3', chatId: 'c3', name: 'Carla Souza', type: 'Dermatologia', priority: 'high', status: 'needs', seconds: 110, alerted: false },
    { id: 'q4', chatId: 'c4', name: 'Fernando Lima', type: 'Nutrição', priority: 'low', status: 'in_service', seconds: 600, alerted: false },
    { id: 'q5', chatId: 'c6', name: 'Roberto Alves', type: 'Financeiro', priority: 'high', status: 'needs', seconds: -95, alerted: true }
  ];
}

function seedFunnel() {
  return [
    { id: 'lead', items: [
      { id: 'f1', name: 'Felipe Melo', value: 180, desc: 'Primeira consulta geral', ts: now - 3600e3 },
      { id: 'f2', name: 'Fernando Lima', value: 220, desc: 'Interesse em Nutrição', chatId: 'c4', ts: now - 1800e3 }
    ]},
    { id: 'qualified', items: [
      { id: 'f3', name: 'Lucas Mendes', value: 150, desc: 'Cotando limpeza dental', chatId: 'c2', ts: now - 700e3 },
      { id: 'f4', name: 'Carla Souza', value: 890, desc: 'Pacote dermatológico + convênio', chatId: 'c3', ts: now - 540e3 }
    ]},
    { id: 'scheduled', items: [
      { id: 'f5', name: 'Ana Beatriz', value: 180, desc: 'Odontologia hoje 14h30', chatId: 'c1', ts: now - 1600e3 },
      { id: 'f6', name: 'Beatriz Ramos', value: 600, desc: 'Cardiologia amanhã 10h', ts: now - 7200e3 },
      { id: 'f7', name: 'Gabriel Alves', value: 450, desc: 'Ortopedia quinta 14h', ts: now - 9000e3 }
    ]},
    { id: 'confirmed', items: [
      { id: 'f8', name: 'Mariana Costa', value: 350, desc: 'Dermatologia hoje 09h — confirmada', chatId: 'c5', ts: now - 5400e3 },
      { id: 'f9', name: 'Camila Nogueira', value: 1200, desc: 'Pacote fisioterapia — confirmado', ts: now - 8000e3 }
    ]},
    { id: 'done', items: [
      { id: 'f10', name: 'Rodrigo Santoro', value: 850, desc: 'Procedimento finalizado', ts: now - 86400e3 },
      { id: 'f11', name: 'Pedro Santos', value: 150, desc: 'Clínica geral — realizado 07h30', ts: now - 14400e3 }
    ]},
    { id: 'lost', items: [
      { id: 'f12', name: 'Otávio Brum', value: 300, desc: 'Preferiu concorrente por preço', ts: now - 172800e3 }
    ]}
  ];
}

function seedMetrics() {
  const rnd = seededRandom(42);
  const days = [];
  const TOTAL = 1825; /* ~5 anos de histórico p/ os períodos longos */
  for (let i = TOTAL - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const dow = d.getDay();
    const base = dow === 0 ? 0.15 : dow === 6 ? 0.55 : 1;
    const growth = 0.55 + 0.45 * (1 - i / TOTAL); /* crescimento ao longo dos anos */
    const revenue = Math.round((900 + rnd() * 1700) * base * growth);
    const chats = Math.round((26 + rnd() * 34) * Math.max(base, .3) * growth);
    const bookings = Math.round(chats * (0.42 + rnd() * 0.22));
    days.push({ date: dateKey(d), revenue, chats, bookings, slaOk: Math.round(88 + rnd() * 11), aiShare: Math.round(88 + rnd() * 9) });
  }
  return { days };
}

function seed() {
  return {
    autopilot: true,
    chats: seedChats(),
    queue: seedQueue(),
    issues: [
      { id: 'i1', chatId: 'c3', name: 'Carla Souza', reason: 'Convênio não cadastrado + desconto de pacote acima de 15% (fora da alçada da IA).', suggested: 'Carla, consegui verificar com a gerência: para o pacote dermatológico fechado conseguimos 12% à vista no Pix, e seu convênio cobre a consulta inicial. Posso montar a proposta?', createdAt: now - 8 * 60000, confidence: 46 },
      { id: 'i2', chatId: 'c6', name: 'Roberto Alves', reason: 'Cobrança em duplicidade — estorno exige aprovação humana do financeiro.', suggested: 'Roberto, identifiquei a cobrança duplicada de R$ 250. O estorno via Pix pode ser feito em até 2h úteis. Confirma a chave do seu telefone para devoluções?', createdAt: now - 21 * 60000, confidence: 31 }
    ],
    appointments: seedAppointments(),
    apptTypes: [
      { id: 't1', name: 'Odontologia — Avaliação', duration: 45, price: 180, color: '#2D8182' },
      { id: 't2', name: 'Dermatologia', duration: 40, price: 350, color: '#C9A227' },
      { id: 't3', name: 'Clínica Geral', duration: 30, price: 150, color: '#0f766e' },
      { id: 't4', name: 'Cardiologia', duration: 50, price: 600, color: '#111827' },
      { id: 't5', name: 'Ortopedia', duration: 45, price: 450, color: '#4d7c0f' },
      { id: 't6', name: 'Fisioterapia (sessão)', duration: 60, price: 120, color: '#a16207' },
      { id: 't7', name: 'Nutrição', duration: 60, price: 220, color: '#065f46' },
      { id: 't8', name: 'Neurologia', duration: 50, price: 550, color: '#2D8182' },
      { id: 't9', name: 'Reumatologia', duration: 45, price: 480, color: '#7c5cbf' },
      { id: 't10', name: 'Pneumologia', duration: 40, price: 420, color: '#3b82c4' },
      { id: 't11', name: 'Nefrologia', duration: 45, price: 460, color: '#c26a3b' },
      { id: 't12', name: 'Geriatria', duration: 50, price: 380, color: '#5b8a72' },
      { id: 't13', name: 'Ginecologia', duration: 40, price: 320, color: '#c45b8a' }
    ],
    funnel: seedFunnel(),
    notifications: [
      { id: uid(), key: 'ev.booked', params: { type: 'Odontologia', name: 'Ana Beatriz', time: '14h30' }, ts: now - 2 * 60000, unread: true, icon: 'calendar', target: { page: 'whatsapp', chatId: 'c1' } },
      { id: uid(), key: 'ev.escalated', params: { name: 'Carla Souza' }, ts: now - 8 * 60000, unread: true, icon: 'alert', target: { page: 'needs', chatId: 'c3' } },
      { id: uid(), key: 'ev.sla', params: { name: 'Roberto Alves', m: 16 }, ts: now - 12 * 60000, unread: true, icon: 'clock', target: { page: 'queue', chatId: 'c6' } },
      { id: uid(), key: 'ev.confirmed', params: { name: 'Mariana Costa' }, ts: now - 90 * 60000, unread: false, icon: 'checkCircle', target: { page: 'schedule' } },
      { id: uid(), key: 'ev.payment', params: { value: { __m: 850 }, name: 'Rodrigo Santoro' }, ts: now - 20 * 3600e3, unread: false, icon: 'dollar', target: { page: 'funnel' } }
    ],
    activity: [
      { id: uid(), key: 'ev.replied', params: { name: 'Lucas Mendes', s: 8 }, ts: now - 60000, icon: 'zap' },
      { id: uid(), key: 'ev.booked', params: { type: 'Odontologia', name: 'Ana Beatriz', time: '14h30' }, ts: now - 27 * 60000, icon: 'calendar' },
      { id: uid(), key: 'ev.confirmed', params: { name: 'Mariana Costa' }, ts: now - 89 * 60000, icon: 'checkCircle' },
      { id: uid(), key: 'ev.lead', params: { name: 'Felipe Melo', type: 'Clínica Geral' }, ts: now - 3600e3, icon: 'users' },
      { id: uid(), key: 'ev.followup', params: { name: 'Gabriel Alves' }, ts: now - 2 * 3600e3, icon: 'refresh' }
    ],
    agentPrompt: DEFAULT_PROMPT,
    guardrails: { g1: true, g2: true, g3: true, g4: true, g5: true, g6: true, g7: true, g8: true, g9: true, g10: true },
    channels: { whatsapp: true, instagram: false, webchat: true, telegram: false },
    knowledge: [
      { id: 'k1', q: 'Quanto custa a consulta?', a: 'Consultas a partir de R$ 150 (clínica geral). Odontologia R$ 180, Dermatologia R$ 350, Cardiologia R$ 600, Nutrição R$ 220. Retorno em até 30 dias incluso.', cat: 'Preços' },
      { id: 'k2', q: 'Qual o horário de funcionamento?', a: 'Segunda a sexta 07h00 às 16h30; sábado 08h00 às 13h00; domingo fechado. A Sophia responde 24h.', cat: 'Horários' },
      { id: 'k3', q: 'Onde fica a clínica?', a: 'Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE. Estacionamento gratuito e acesso adaptado.', cat: 'Localização' },
      { id: 'k4', q: 'Quais convênios são aceitos?', a: 'Unimed, Bradesco Saúde, Amil e SulAmérica para consultas. Pacotes e procedimentos estéticos: somente particular. Casos fora da lista → humano.', cat: 'Convênios' },
      { id: 'k5', q: 'Como remarcar ou cancelar?', a: 'Remarcação/cancelamento gratuitos até 4h antes. A Sophia oferece 2 novas opções de horário e atualiza a agenda.', cat: 'Políticas' },
      { id: 'k6', q: 'Quais especialidades atendem?', a: SPECIALTIES.join(', ') + '.', cat: 'Serviços' },
      { id: 'k7', q: 'É uma emergência, o que eu faço?', a: 'Emergências não são atendidas por aqui. Ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. Posso agendar uma consulta de rotina depois que você estiver seguro.', cat: 'Segurança' },
      { id: 'k8', q: 'Preciso de preparo para os exames?', a: 'Depende do exame. Após agendar, enviamos as instruções de preparo por WhatsApp (jejum, suspender medicações, etc.). Em caso de dúvida, nossa equipe confirma antes do procedimento.', cat: 'Preparo' },
      { id: 'k9', q: 'Quais as formas de pagamento e parcelamento?', a: 'Pix, cartão de crédito/débito e link de pagamento. Consultas podem ser parceladas em até 3x sem juros no cartão. Pacotes têm condições especiais com um atendente.', cat: 'Pagamento' },
      { id: 'k10', q: 'Atendem crianças? Menor pode ir sozinho?', a: 'Sim, temos pediatria e atendimento infantil. Menores de 18 anos devem estar acompanhados do responsável legal, que autoriza o atendimento e o pagamento.', cat: 'Políticas' },
      { id: 'k11', q: 'Vocês fazem telemedicina / consulta online?', a: 'Sim para especialidades elegíveis (clínica geral, nutrição, psicologia e psiquiatria). O link da videochamada é enviado 15 min antes. Demais especialidades são presenciais.', cat: 'Serviços' },
      { id: 'k12', q: 'Como recebo resultados de exames?', a: 'Resultados ficam disponíveis no portal do paciente e também enviamos o PDF por WhatsApp assim que liberados. O prazo varia por exame e é informado no agendamento.', cat: 'Exames' },
      { id: 'k13', q: 'A clínica é acessível?', a: 'Sim. Temos acesso adaptado para cadeirantes, elevador, banheiro acessível e estacionamento gratuito com vagas preferenciais na Av. Beira Mar, 1500.', cat: 'Localização' },
      { id: 'k14', q: 'Como meus dados são tratados (LGPD)?', a: 'Seus dados são usados apenas para o atendimento, com sigilo e conforme a LGPD. Não compartilhamos com terceiros. Você pode solicitar acesso, correção ou exclusão a qualquer momento.', cat: 'Privacidade' }
    ],
    tone: { formality: 35, warmth: 85, length: 40, emoji: 55 },
    procedures: [
      { id: 'p1', key: 'ai.proc.booking', enabled: true, steps: ['Identificar especialidade desejada', 'Oferecer 2 horários livres reais da agenda', 'Confirmar nome completo e valor', 'Criar agendamento + mover funil para "Agendada"', 'Enviar confirmação e programar lembrete'] },
      { id: 'p2', key: 'ai.proc.reschedule', enabled: true, steps: ['Localizar consulta pelo telefone', 'Verificar regra de 4h de antecedência', 'Oferecer 2 novos horários', 'Atualizar agenda e Google Calendar'] },
      { id: 'p3', key: 'ai.proc.cancel', enabled: true, steps: ['Confirmar identidade do paciente', 'Cancelar e liberar o horário', 'Oferecer remarcação futura', 'Registrar motivo no funil'] },
      { id: 'p4', key: 'ai.proc.payment', enabled: true, steps: ['Gerar link Pix/cartão do valor confirmado', 'Acompanhar pagamento via webhook', 'Dar baixa e enviar recibo', 'Duplicidade/estorno → humano'] },
      { id: 'p5', key: 'ai.proc.handoff', enabled: true, steps: ['Detectar gatilho (urgência, reclamação, desconto >15%)', 'Resumir contexto para o atendente', 'Criar item em "Precisa de você"', 'Pausar IA naquela conversa'] },
      { id: 'p6', key: 'ai.proc.followup', enabled: true, steps: ['Lembrete 24h e 1h antes da consulta', 'Follow-up de lead frio após 48h', 'Pedido de avaliação pós-consulta', 'Reativar lead perdido após 30 dias'] }
    ],
    versions: [
      { id: 'v3', v: '1.2', note: 'Novos horários (07h) + regra de escalonamento financeiro', ts: now - 2 * 86400e3, active: true },
      { id: 'v2', v: '1.1', note: 'Tom mais acolhedor + emojis moderados', ts: now - 9 * 86400e3, active: false },
      { id: 'v1', v: '1.0', note: 'Versão inicial — agendamento e dúvidas', ts: now - 21 * 86400e3, active: false }
    ],
    quickReplies: [
      { id: 'qr1', trigger: 'preço|valor|quanto', text: 'Nossas consultas começam em R$ 150 com retorno incluso. 💚 Qual especialidade você procura? Já verifico os horários!' },
      { id: 'qr2', trigger: 'horário|hora|funciona', text: 'Atendemos seg–sex 07h–16h30 e sáb 08h–13h. Domingo fechado. Quer que eu veja um horário para você?' },
      { id: 'qr3', trigger: 'endereço|onde|local', text: 'Estamos na Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE, com estacionamento gratuito. 📍' },
      { id: 'qr4', trigger: 'agendar|marcar|consulta', text: 'Vamos agendar! 😊 Me diga a especialidade e sua preferência de dia/turno que eu verifico a agenda agora.' },
      { id: 'qr5', trigger: 'convênio|plano|unimed', text: 'Aceitamos Unimed, Bradesco, Amil e SulAmérica para consultas. Qual é o seu plano? Verifico a cobertura.' }
    ],
    settings: {
      profile: { name: 'Clínica Vida Plena', segment: 'Clínica multiespecialidades', address: 'Av. Beira Mar, 1500 — Aracaju/SE', phone: '+55 79 3021-4500', role: 'gestor', greeting: 'Olá! 👋 Sou a Sophia, assistente virtual da Clínica Vida Plena. Como posso ajudar você hoje?' },
      playbook: { pb1: true, pb2: true, pb3: true, pb4: true, pb5: true, pb6: true },
      autopilot: { mode: 'full', confidence: 70, offhours: true, followup: true, remind: true }
    },
    integrations: {
      qr: { connected: true, number: '+55 79 99999-0001' },
      meta: { connected: false, token: '', phoneId: '', waba: '' },
      google: { connected: true, lastSync: now - 15 * 60000, account: 'agenda@vidaplena.com.br' },
      payments: { connected: true, provider: 'Mercado Pago', pixKey: 'financeiro@vidaplena.com.br', methods: ['pix', 'credit', 'debit', 'link'] },
      crm: { connected: false },
      webhook: { connected: false, url: '' }
    },
    metrics: seedMetrics(),
    internalChat: [],
    counters: { chatsToday: 142, solvedPct: 94, avgResponse: 12, revenueMonth: 14850 }
  };
}

/* ---------------- Estado + persistência ---------------- */
export let state = storage.get('state', null) || seed();
/* Migração: garante histórico completo (~5 anos) p/ os períodos longos de faturamento */
if (!state.metrics || !state.metrics.days || state.metrics.days.length < 1825) state.metrics = seedMetrics();

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => storage.set('state', state), 300);
}
export function commit(evt = 'state', data) {
  save();
  bus.emit(evt, data);
  if (evt !== 'state') bus.emit('state', data);
}
export function resetDemo() {
  storage.clearAll();
  state = seed();
  commit('reset');
}

/* ---------------- Mutations ---------------- */
export function addNotification(key, params, icon, target) {
  state.notifications.unshift({ id: uid(), key, params, ts: Date.now(), unread: true, icon, target });
  state.notifications = state.notifications.slice(0, 40);
  commit('notifications');
}
export function markAllRead() { state.notifications.forEach(n => n.unread = false); commit('notifications'); }
export function markRead(id) { const n = state.notifications.find(n => n.id === id); if (n) { n.unread = false; commit('notifications'); } }
export function clearNotifications() { state.notifications = []; commit('notifications'); }

export function addActivity(key, params, icon) {
  state.activity.unshift({ id: uid(), key, params, ts: Date.now(), icon });
  state.activity = state.activity.slice(0, 30);
  commit('activity');
}

export function getChat(id) { return state.chats.find(c => c.id === id); }

export function addMessage(chatId, msg) {
  const chat = getChat(chatId);
  if (!chat) return;
  chat.messages.push({ id: uid(), ts: Date.now(), ...msg });
  if (msg.sender === 'user') chat.unread = (chat.unread || 0) + 1;
  commit('chats', { chatId });
}

export function setChatMode(chatId, mode) {
  const chat = getChat(chatId);
  if (!chat) return;
  chat.mode = mode;
  if (mode === 'human' && chat.status !== 'needs') chat.status = 'human';
  if (mode === 'ai') chat.status = 'active';
  const q = state.queue.find(q => q.chatId === chatId);
  if (q && mode === 'ai' && q.status === 'needs') q.status = 'in_service';
  commit('chats', { chatId });
}

export function addAppointment(appt) {
  state.appointments.push({ id: uid(), source: 'manual', status: 'confirmed', duration: 45, ...appt });
  commit('appointments');
}
export function updateAppointment(id, patch) {
  const a = state.appointments.find(a => a.id === id);
  if (a) { Object.assign(a, patch); commit('appointments'); }
}
export function deleteAppointment(id) {
  state.appointments = state.appointments.filter(a => a.id !== id);
  commit('appointments');
}

export function moveLead(leadId, toStage, byAI = false) {
  let lead = null;
  for (const col of state.funnel) {
    const idx = col.items.findIndex(i => i.id === leadId);
    if (idx >= 0) { lead = col.items.splice(idx, 1)[0]; break; }
  }
  if (!lead) return null;
  const target = state.funnel.find(c => c.id === toStage);
  lead.ts = Date.now();
  target.items.unshift(lead);
  const chat = lead.chatId && getChat(lead.chatId);
  if (chat) chat.stage = toStage;
  commit('funnel', { lead, toStage, byAI });
  return lead;
}
export function addLead(stage, lead) {
  const col = state.funnel.find(c => c.id === stage);
  col.items.unshift({ id: uid(), ts: Date.now(), ...lead });
  commit('funnel');
}
export function deleteLead(leadId) {
  state.funnel.forEach(c => c.items = c.items.filter(i => i.id !== leadId));
  commit('funnel');
}

export function addIssue(issue) {
  state.issues.unshift({ id: uid(), createdAt: Date.now(), ...issue });
  commit('issues');
}
export function removeIssue(id) {
  state.issues = state.issues.filter(i => i.id !== id);
  commit('issues');
}

export function funnelTotal(stageIds) {
  return state.funnel.filter(c => !stageIds || stageIds.includes(c.id))
    .reduce((s, c) => s + c.items.reduce((a, i) => a + (i.value || 0), 0), 0);
}

export function todayAppointments() {
  return state.appointments.filter(a => a.date === dateKey(new Date()) && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function isOpenNow() {
  const d = new Date(), h = HOURS[d.getDay()];
  if (!h) return false;
  const mins = d.getHours() * 60 + d.getMinutes();
  const [oh, om] = h.open.split(':').map(Number), [ch, cm] = h.close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}
