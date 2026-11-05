/* =====================================================================
   MeAtende AI — sophia.js
   Motor de respostas da Sophia (simulação de IA contextual) +
   Agente Interno (gerente que lê os dados reais do estado).
   ===================================================================== */
import { t, getLang, L } from './i18n.js';
import { loc } from './content.js';
import { state, HOURS, SPECIALTIES, addAppointment, moveLead, addLead, addNotification, addActivity, addIssue, addMessage, getChat, setChatMode, todayAppointments, funnelTotal, SLA_SECONDS } from './store.js';
import { money, dateKey, addDays, fmtDate, fmtDateNum, uid } from './utils.js';

/* Traduz uma resposta do catálogo R no idioma ativo (retraduz ao trocar idioma) */
export function sophiaText(key, params) {
  let s = R[key]?.[getLang()] || R[key]?.pt || key;
  if (params) for (const k in params) s = s.replaceAll('{' + k + '}', typeof params[k] === 'object' ? L(params[k]) : loc(params[k]));
  return s;
}
/* Texto de uma mensagem da Sophia guardada (retraduzível) */
export function sophiaMessageText(m) {
  if (m.ssrc === 'T') return t(m.skey, m.sparams);
  if (m.ssrc === 'R') return sophiaText(m.skey, m.sparams);
  return loc(m.text);
}

/* ---------- Respostas por idioma ---------- */
const R = {
  greeting: {
    pt: 'Olá! Que bom ter você por aqui. 👋 Sou a Sophia, atendente da Clínica Vida Plena. Posso tirar dúvidas, informar valores e agendar sua consulta em mais de 15 especialidades. Como posso ajudar?',
    en: 'Hello! Great to have you here. 👋 I\'m Sophia, from Vida Plena Clinic. I can answer questions, share prices and book your appointment across 15+ specialties. How can I help?',
    es: '¡Hola! Qué bueno tenerte por aquí. 👋 Soy Sophia, de la Clínica Vida Plena. Puedo resolver dudas, informar precios y agendar tu cita en más de 15 especialidades. ¿Cómo te ayudo?',
    fr: 'Bonjour ! Ravie de vous accueillir. 👋 Je suis Sophia, de la Clinique Vida Plena. Je peux répondre à vos questions, donner les tarifs et réserver votre consultation dans plus de 15 spécialités. Comment puis-je aider ?'
  },
  specialties: {
    pt: 'Temos 16 especialidades: odontologia, oftalmologia, dermatologia, clínica geral, cardiologia, ginecologia, pediatria, ortopedia, otorrino, endocrinologia, gastro, urologia, psicologia, psiquiatria, nutrição e fisioterapia. Qual delas você precisa? 😊',
    en: 'We have 16 specialties: dentistry, ophthalmology, dermatology, general practice, cardiology, gynecology, pediatrics, orthopedics, ENT, endocrinology, gastro, urology, psychology, psychiatry, nutrition and physiotherapy. Which one do you need? 😊',
    es: 'Tenemos 16 especialidades: odontología, oftalmología, dermatología, clínica general, cardiología, ginecología, pediatría, ortopedia, otorrino, endocrinología, gastro, urología, psicología, psiquiatría, nutrición y fisioterapia. ¿Cuál necesitas? 😊',
    fr: 'Nous avons 16 spécialités : dentisterie, ophtalmologie, dermatologie, médecine générale, cardiologie, gynécologie, pédiatrie, orthopédie, ORL, endocrinologie, gastro, urologie, psychologie, psychiatrie, nutrition et kinésithérapie. Laquelle vous faut-il ? 😊'
  },
  health: {
    pt: 'Entendo sua preocupação! 💚 Como assistente virtual, não posso dar diagnósticos nem indicar medicamentos — isso é papel do profissional de saúde. O que posso fazer agora é agendar sua avaliação. Tenho horários hoje e amanhã. Quer que eu veja?',
    en: 'I understand your concern! 💚 As a virtual assistant I can\'t diagnose or recommend medication — that\'s for a health professional. What I can do right now is book your evaluation. I have slots today and tomorrow. Shall I check?',
    es: '¡Entiendo tu preocupación! 💚 Como asistente virtual no puedo diagnosticar ni indicar medicamentos — eso es del profesional de salud. Lo que sí puedo es agendar tu evaluación. Tengo horarios hoy y mañana. ¿Los reviso?',
    fr: 'Je comprends votre inquiétude ! 💚 En tant qu’assistante virtuelle, je ne peux ni diagnostiquer ni conseiller de médicaments — c’est le rôle du professionnel de santé. Je peux réserver votre évaluation dès maintenant. J’ai des créneaux aujourd’hui et demain. Je vérifie ?'
  },
  price: {
    pt: 'Nossos valores: Clínica Geral R$ 150 · Odontologia R$ 180 · Nutrição R$ 220 · Dermatologia R$ 350 · Cardiologia R$ 600 — todos com retorno em 30 dias incluso. 💚 Qual especialidade te interessa? Já posso garantir um horário.',
    en: 'Our prices: General Practice R$ 150 · Dentistry R$ 180 · Nutrition R$ 220 · Dermatology R$ 350 · Cardiology R$ 600 — all with a 30-day follow-up included. 💚 Which specialty interests you? I can secure a slot right away.',
    es: 'Nuestros precios: Clínica General R$ 150 · Odontología R$ 180 · Nutrición R$ 220 · Dermatología R$ 350 · Cardiología R$ 600 — todos con revisión en 30 días incluida. 💚 ¿Qué especialidad te interesa? Puedo asegurar un horario ya.',
    fr: 'Nos tarifs : Médecine générale 150 R$ · Dentisterie 180 R$ · Nutrition 220 R$ · Dermatologie 350 R$ · Cardiologie 600 R$ — suivi à 30 jours inclus. 💚 Quelle spécialité vous intéresse ? Je peux garantir un créneau.'
  },
  hours: {
    pt: 'Funcionamos assim: segunda a sexta das 07h00 às 16h30, sábado das 08h00 às 13h00 e domingo fechado. Eu respondo 24h por aqui! ⏰ Quer agendar dentro desses horários?',
    en: 'Our hours: Monday–Friday 7:00–16:30, Saturday 8:00–13:00, closed Sunday. I\'m here 24/7 though! ⏰ Want to book within these hours?',
    es: 'Nuestro horario: lunes a viernes de 07:00 a 16:30, sábado de 08:00 a 13:00 y domingo cerrado. ¡Yo respondo 24h! ⏰ ¿Agendamos dentro de esos horarios?',
    fr: 'Nos horaires : lundi–vendredi 7h00–16h30, samedi 8h00–13h00, fermé le dimanche. Moi, je réponds 24h/24 ! ⏰ On réserve sur ces horaires ?'
  },
  location: {
    pt: 'Estamos na Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE. 📍 Temos estacionamento gratuito e acesso adaptado. Quer combinar sua visita?',
    en: 'We\'re at Av. Beira Mar, 1500 — Block B, Room 402, Aracaju/SE. 📍 Free parking and wheelchair access. Shall we schedule your visit?',
    es: 'Estamos en Av. Beira Mar, 1500 — Bloque B, Sala 402, Aracaju/SE. 📍 Estacionamiento gratuito y acceso adaptado. ¿Coordinamos tu visita?',
    fr: 'Nous sommes au 1500 Av. Beira Mar — Bloc B, Salle 402, Aracaju/SE. 📍 Parking gratuit et accès PMR. On planifie votre visite ?'
  },
  insurance: {
    pt: 'Aceitamos Unimed, Bradesco Saúde, Amil e SulAmérica para consultas. Para pacotes e condições especiais, um atendente humano consegue a melhor negociação — posso transferir você com todo o contexto. Pode ser?',
    en: 'We accept Unimed, Bradesco Saúde, Amil and SulAmérica for consultations. For packages and special conditions, a human agent can negotiate the best deal — I can transfer you with full context. OK?',
    es: 'Aceptamos Unimed, Bradesco Saúde, Amil y SulAmérica para consultas. Para paquetes y condiciones especiales, un agente humano negocia mejor — puedo transferirte con todo el contexto. ¿Te parece?',
    fr: 'Nous acceptons Unimed, Bradesco Saúde, Amil et SulAmérica pour les consultations. Forfaits et conditions spéciales : un agent humain négocie au mieux — je peux vous transférer avec le contexte. D’accord ?'
  },
  payment: {
    pt: 'Você pode pagar no Pix, cartão ou link de pagamento — direto aqui no WhatsApp! 💳 Assim que confirmar o horário, gero o link com o valor. Quer seguir?',
    en: 'You can pay via Pix, card or payment link — right here on WhatsApp! 💳 Once the slot is confirmed I\'ll generate the link. Shall we proceed?',
    es: 'Puedes pagar por Pix, tarjeta o enlace de pago — ¡aquí mismo en WhatsApp! 💳 Al confirmar el horario genero el enlace. ¿Seguimos?',
    fr: 'Vous pouvez payer par Pix, carte ou lien de paiement — ici même sur WhatsApp ! 💳 Dès le créneau confirmé, je génère le lien. On continue ?'
  },
  escalate: {
    pt: 'Entendi. Esse assunto precisa de atenção personalizada, então vou transferir você agora para nossa equipe humana com todo o histórico da conversa. Em instantes alguém assume — o prazo máximo é de 15 minutos. 🙏',
    en: 'Understood. This needs personalized attention, so I\'m transferring you to our human team with the full chat history. Someone will take over shortly — within 15 minutes at most. 🙏',
    es: 'Entendido. Este asunto necesita atención personalizada, así que te transfiero ahora a nuestro equipo humano con todo el historial. Alguien asumirá en breve — máximo 15 minutos. 🙏',
    fr: 'Compris. Ce sujet demande une attention personnalisée : je vous transfère à notre équipe humaine avec tout l’historique. Quelqu’un prendra le relais sous 15 minutes maximum. 🙏'
  },
  bookingAsk: {
    pt: 'Perfeito, vamos agendar! 🗓️ Me diga: qual especialidade e qual dia/turno você prefere? Atendemos seg–sex 07h–16h30 e sáb 08h–13h.',
    en: 'Perfect, let\'s book! 🗓️ Tell me: which specialty and which day/shift do you prefer? We\'re open Mon–Fri 7:00–16:30 and Sat 8:00–13:00.',
    es: '¡Perfecto, agendemos! 🗓️ Dime: ¿qué especialidad y qué día/turno prefieres? Atendemos lun–vie 07–16:30 y sáb 08–13.',
    fr: 'Parfait, réservons ! 🗓️ Dites-moi : quelle spécialité et quel jour/créneau préférez-vous ? Ouvert lun–ven 7h–16h30 et sam 8h–13h.'
  },
  slots: {
    pt: 'Encontrei estes horários livres: {slots}. A consulta fica em {price} com retorno incluso. É só me dizer qual prefere! ✅',
    en: 'I found these free slots: {slots}. The appointment is {price} with follow-up included. Just tell me which one you prefer! ✅',
    es: 'Encontré estos horarios libres: {slots}. La cita queda en {price} con revisión incluida. ¡Dime cuál prefieres! ✅',
    fr: 'J’ai trouvé ces créneaux libres : {slots}. La consultation est à {price}, suivi inclus. Dites-moi lequel vous préférez ! ✅'
  },
  booked: {
    pt: 'Agendado com sucesso! ✅\n\n📋 {type}\n👨‍⚕️ {doctor}\n📅 {date} às {time}\n💰 {price}\n\nEnviarei um lembrete 1h antes. Chegue 10 min antes, combinado? Qualquer coisa, é só me chamar por aqui! 💚',
    en: 'Successfully booked! ✅\n\n📋 {type}\n👨‍️ {doctor}\n📅 {date} at {time}\n💰 {price}\n\nI\'ll send a reminder 1h before. Please arrive 10 min early, deal? Anything else, just message me here! 💚',
    es: '¡Agendado con éxito! ✅\n\n📋 {type}\n👨‍⚕️ {doctor}\n📅 {date} a las {time}\n💰 {price}\n\nEnviaré un recordatorio 1h antes. Llega 10 min antes, ¿vale? ¡Cualquier cosa, escríbeme por aquí! 💚',
    fr: 'Réservé avec succès ! ✅\n\n📋 {type}\n👨‍⚕️ {doctor}\n📅 {date} à {time}\n💰 {price}\n\nJ’enverrai un rappel 1h avant. Arrivez 10 min en avance, d’accord ? Besoin d’autre chose, écrivez-moi ici ! 💚'
  },
  fallback: {
    pt: 'Entendi! Para eu te ajudar da melhor forma: você quer agendar uma consulta, saber valores ou tirar uma dúvida sobre a clínica? Posso resolver os três por aqui mesmo. 😊',
    en: 'Got it! To help you best: do you want to book an appointment, know prices, or ask about the clinic? I can handle all three right here. 😊',
    es: '¡Entendido! Para ayudarte mejor: ¿quieres agendar una cita, saber precios o resolver una duda de la clínica? Puedo con las tres por aquí. 😊',
    fr: 'Compris ! Pour mieux vous aider : souhaitez-vous réserver, connaître les tarifs ou poser une question sur la clinique ? Je gère les trois ici même. 😊'
  },
  thanks: {
    pt: 'Eu que agradeço! 💚 Conte comigo sempre que precisar. A equipe da Clínica Vida Plena deseja um ótimo dia!',
    en: 'Thank YOU! 💚 Count on me anytime. The Vida Plena team wishes you a great day!',
    es: '¡Gracias a ti! 💚 Cuenta conmigo siempre. ¡El equipo de Vida Plena te desea un gran día!',
    fr: 'C’est moi qui vous remercie ! 💚 Comptez sur moi à tout moment. L’équipe Vida Plena vous souhaite une excellente journée !'
  },
  emergency: {
    pt: '🚨 Isso pode ser uma emergência. Não espere por uma consulta: ligue agora 192 (SAMU) ou vá ao pronto-socorro mais próximo. Se puder, peça a alguém para acompanhar você. Estou avisando nossa equipe humana para dar suporte. Sua segurança vem primeiro. 💚',
    en: '🚨 This could be an emergency. Don\'t wait for an appointment: call 192 (SAMU) now or go to the nearest emergency room. If you can, have someone stay with you. I\'m alerting our human team to support you. Your safety comes first. 💚',
    es: '🚨 Esto puede ser una emergencia. No esperes una cita: llama ahora al 192 (SAMU) o ve a urgencias más cercano. Si puedes, pide a alguien que te acompañe. Estoy avisando a nuestro equipo humano. Tu seguridad es lo primero. 💚',
    fr: '🚨 Cela peut être une urgence. N’attendez pas un rendez-vous : appelez le 192 (SAMU) ou allez aux urgences les plus proches. Si possible, faites-vous accompagner. Je préviens notre équipe humaine. Votre sécurité avant tout. 💚'
  }
};

function tr(key, params) {
  let s = R[key]?.[getLang()] || R[key]?.pt || key;
  if (params) for (const k in params) s = s.replaceAll('{' + k + '}', params[k]);
  return s;
}

/* ---------- Detecção de intenção multilíngue ---------- */
const INTENT_RULES = [
  { intent: 'emergency', re: /emerg[eê]nc|dor no peito|desmai|sangram|infarto|avc|derrame|n[ãa]o consigo respirar|falta de ar|suic[ií]d|emergency|heart attack|stroke|can'?t breathe|chest pain|emergencia|infarto|no puedo respirar|urgence|crise cardiaque|je ne peux pas respirer/i },
  { intent: 'escalate', re: /urgent|dor (muito |muito )?forte|reclama|estorno|cobran|duplicad|humano|atendente|pessoa real|complaint|refund|overcharg|human|agent|queja|reembolso|plainte|remboursement|humain/i },
  { intent: 'book', re: /agendar|marcar|marca(r|ção)|consulta|hor[áa]rio|vaga|reservar|book|appoint|schedul|slot|cita|reserv|rendez|cr[eé]neau/i },
  { intent: 'price', re: /pre[çc]o|valor|quanto custa|quanto [ée]|custo|price|cost|how much|precio|cu[áa]nto|tarif|prix|combien/i },
  { intent: 'insurance', re: /conv[êe]nio|plano de sa[úu]de|unimed|amil|bradesco|seguro|insurance|seguro m[ée]dico|assurance|mutuelle/i },
  { intent: 'payment', re: /pagar|pagamento|pix|cart[ãa]o|link de pag|pay|payment|card|pago|tarjeta|paiement|carte/i },
  { intent: 'hours', re: /hor[áa]rio de func|que horas|abre|fecha(m|do)|funciona|open|clos(e|ing)|hours|atiende|cierra|ouvre|ferme|horaires/i },
  { intent: 'location', re: /endereço|onde fica|localiza|address|where|direcci[óo]n|d[óo]nde|adresse|o[ùu] (est|se)/i },
  { intent: 'health', re: /dor|sintoma|rem[ée]dio|medicament|diagn[óo]st|doente|pain|symptom|medicine|diagnos|sick|dolor|s[íi]ntoma|medicamento|enfermo|douleur|sympt[ôo]me|m[ée]dicament|malade/i },
  { intent: 'specialties', re: /especialidad|servi[çc]o|quais|que (m[ée]dicos|[áa]reas)|tem atendimento|specialt|service|which|servicio|qu[ée]|sp[ée]cialit|services/i },
  { intent: 'greeting', re: /^(ol[áa]|oi|bom dia|boa tarde|boa noite|hey|hi|hello|good (morning|afternoon|evening)|hola|buenos|buenas|bonjour|bonsoir|salut)\b/i },
  { intent: 'thanks', re: /obrigad|valeu|thanks|thank you|gracias|merci/i }
];

export function detectIntent(text) {
  for (const r of INTENT_RULES) if (r.re.test(text)) return r.intent;
  return 'fallback';
}

const SPEC_MAP = [
  { re: /odonto|dent|limpeza|dente/i, type: 't1', name: 'Odontologia', doctor: 'd2', doctorName: 'Dra. Juliana Paes', price: 180 },
  { re: /derma|pele|acne|mancha/i, type: 't2', name: 'Dermatologia', doctor: 'd1', doctorName: 'Dr. Carlos Eduardo', price: 350 },
  { re: /cl[íi]nica geral|geral|check.?up/i, type: 't3', name: 'Clínica Geral', doctor: 'd3', doctorName: 'Dra. Renata Vieira', price: 150 },
  { re: /cardio|cora[çc][ãa]o|press[ãa]o/i, type: 't4', name: 'Cardiologia', doctor: 'd1', doctorName: 'Dr. Carlos Eduardo', price: 600 },
  { re: /ortop|joelho|coluna|osso/i, type: 't5', name: 'Ortopedia', doctor: 'd4', doctorName: 'Dr. André Matos', price: 450 },
  { re: /fisio|reabilit/i, type: 't6', name: 'Fisioterapia', doctor: 'd4', doctorName: 'Dr. André Matos', price: 120 },
  { re: /nutri|dieta|emagrec|alimenta/i, type: 't7', name: 'Nutrição', doctor: 'd5', doctorName: 'Dra. Paula Nunes', price: 220 },
  { re: /neuro|cabe[çc]a|enxaqueca|mem[óo]ria|tremor/i, type: 't8', name: 'Neurologia', doctor: 'd6', doctorName: 'Dra. Fernanda Lopes', price: 550 },
  { re: /reuma|artrite|articula|fibromialgia/i, type: 't9', name: 'Reumatologia', doctor: 'd7', doctorName: 'Dr. Ricardo Salles', price: 480 },
  { re: /pneumo|pulm|asma|bronquite|tosse|respira/i, type: 't10', name: 'Pneumologia', doctor: 'd8', doctorName: 'Dra. Beatriz Andrade', price: 420 },
  { re: /nefro|rim|renal|c[áa]lculo renal/i, type: 't11', name: 'Nefrologia', doctor: 'd9', doctorName: 'Dr. Marcelo Tavares', price: 460 },
  { re: /geriatr|idoso|terceira idade/i, type: 't12', name: 'Geriatria', doctor: 'd7', doctorName: 'Dr. Ricardo Salles', price: 380 },
  { re: /gineco|preventivo|obstetr|gestante|gravidez/i, type: 't13', name: 'Ginecologia', doctor: 'd10', doctorName: 'Dra. Sofia Almeida', price: 320 }
];

export function detectSpecialty(text) {
  for (const s of SPEC_MAP) if (s.re.test(text)) return s;
  return null;
}

/* ---------- Slots reais baseados na agenda ---------- */
export function availableSlots(dayOffset = 0, count = 3) {
  const slots = [];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayKey = dateKey(now);
  const LEAD = 30; /* antecedência mínima (min) para agendar ainda hoje */
  for (let off = dayOffset; off < dayOffset + 14 && slots.length < count; off++) {
    const d = addDays(now, off);
    const dow = d.getDay();
    const h = HOURS[dow];
    if (!h) continue;
    const key = dateKey(d);
    const busy = new Set(state.appointments.filter(a => a.date === key && a.status !== 'cancelled').map(a => a.time));
    const start = parseInt(h.open) * 60 + parseInt(h.open.split(':')[1]);
    const end = parseInt(h.close) * 60 + parseInt(h.close.split(':')[1]);
    for (let m = start; m + 45 <= end && slots.length < count; m += 60) {
      /* Em tempo real: nunca oferecer horário que já passou (hoje) */
      if (key === todayKey && m < nowMin + LEAD) continue;
      const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      if (!busy.has(time)) slots.push({ date: key, time, label: `${fmtDate(d, { day: '2-digit', month: '2-digit' })} ${time}` });
    }
  }
  return slots;
}

export function findChosenSlot(text) {
  const slots = availableSlots(0, 6);
  const byLabel = slots.find(s => text.includes(s.label));
  if (byLabel) return byLabel;
  const m = text.match(/(\d{1,2}):(\d{2})/) || text.match(/(\d{1,2})h(\d{2})?/i);
  if (m) {
    const time = `${String(m[1]).padStart(2, '0')}:${m[2] || '00'}`;
    const found = slots.find(s => s.time === time);
    if (found) return found;
  }
  if (/primeir|first|primer|premier/i.test(text)) return slots[0];
  if (/segund|second|deuxi/i.test(text)) return slots[1];
  return null;
}

/* =====================================================================
   FLUXO PRINCIPAL — responde como a Sophia e executa ações reais
   ===================================================================== */
export function sophiaRespond(chat, userText, opts = {}) {
  const intent = detectIntent(userText);
  chat.intent = intentLabel(intent);
  const result = { text: '', intent, actions: [] };

  /* Memória de contexto: evita repetir informação já dada */
  chat.bookingFlow ||= {};
  chat.memory ||= { topics: {}, fallback: 0, greeted: false };
  const flow = chat.bookingFlow, mem = chat.memory;
  const detected = detectSpecialty(userText);
  if (detected) flow.spec = detected;
  const spec = detected || flow.spec || SPEC_MAP[2];

  const sayR = (key, params) => { result.ssrc = 'R'; result.skey = key; result.sparams = params; result.text = sophiaText(key, params); return result.text; };
  const sayT = (key, params) => { result.ssrc = 'T'; result.skey = key; result.sparams = params; result.text = t(key, params); return result.text; };
  const hoursStr = `${t('hours.weekdays')} 07:00–16:30 · ${t('hours.sat')} 08:00–13:00`;

  /* Escolha de horário → cria agendamento de verdade */
  const chosen = findChosenSlot(userText);
  if (flow.step === 'await_slot' && chosen) {
    const s = flow.spec || spec;
    sayR('booked', { type: s.name, doctor: s.doctorName, date: fmtDateNum(new Date(chosen.date + 'T12:00:00')), time: chosen.time, price: { __m: s.price } });
    result.actions.push('booking');
    result.booking = { type: s.name, time: chosen.time, doctor: s.doctorName, value: s.price, date: chosen.date };
    flow.step = null; mem.fallback = 0;
    if (!opts.noSideEffects) {
      addAppointment({ date: chosen.date, time: chosen.time, patient: chat.name, doctor: s.doctor, type: s.type, duration: 45, source: 'sophia' });
      let lead = state.funnel.flatMap(c => c.items).find(i => i.chatId === chat.id);
      if (lead) moveLead(lead.id, 'scheduled', true);
      else addLead('scheduled', { name: chat.name, value: s.price, desc: `${s.name} — ${chosen.time}`, chatId: chat.id });
      addNotification('ev.booked', { type: s.name, name: chat.name, time: chosen.time }, 'calendar', { page: 'whatsapp', chatId: chat.id });
      addActivity('ev.booked', { type: s.name, name: chat.name, time: chosen.time }, 'calendar');
      chat.stage = 'scheduled';
    }
    return result;
  }

  const handoff = (reason, keepText) => {
    if (!keepText) sayT('sophia.wait');
    result.actions.push('escalate');
    if (!opts.noSideEffects) {
      setChatMode(chat.id, 'human');
      chat.status = 'needs';
      const q = state.queue.find(q => q.chatId === chat.id);
      if (q) { q.status = 'needs'; q.priority = 'high'; }
      if (!state.issues.find(i => i.chatId === chat.id)) {
        addIssue({ chatId: chat.id, name: chat.name, reason, suggested: t('sophia.wait'), confidence: 35 });
        addNotification('ev.escalated', { name: chat.name }, 'alert', { page: 'needs', chatId: chat.id });
        addActivity('ev.escalated', { name: chat.name }, 'alert');
      }
    }
  };

  if (intent !== 'fallback') mem.fallback = 0;

  switch (intent) {
    case 'emergency':
      handoff('Emergência detectada — paciente orientado a ligar 192 (SAMU).', true);
      sayR('emergency');
      break;
    case 'greeting':
      if (mem.greeted) sayT('sophia.already.greeting'); else { sayR('greeting'); mem.greeted = true; }
      break;
    case 'specialties':
      if (mem.topics.specialties) sayT('sophia.already.specialties');
      else { sayT('sophia.specialties.list', { n: SPECIALTIES.length, list: SPECIALTIES.map(loc).join(', ') }); mem.topics.specialties = true; }
      break;
    case 'health':
      sayR('health'); flow.step = 'await_slot'; flow.spec = spec; result.slots = availableSlots(0, 3); break;
    case 'price':
      if (mem.topics.price) sayT('sophia.already.price', { min: { __m: 150 } });
      else { sayR('price'); mem.topics.price = true; }
      if (state.settings.playbook.pb2) { flow.step = 'await_slot'; flow.spec = spec; result.slots = availableSlots(0, 3); }
      break;
    case 'hours':
      if (mem.topics.hours) sayT('sophia.already.hours', { hours: hoursStr }); else { sayR('hours'); mem.topics.hours = true; }
      break;
    case 'location':
      if (mem.topics.location) sayT('sophia.already.location', { addr: loc(state.settings.profile.address) }); else { sayR('location'); mem.topics.location = true; }
      break;
    case 'insurance': sayR('insurance'); break;
    case 'payment': sayR('payment'); break;
    case 'thanks': sayR('thanks'); break;
    case 'escalate':
      handoff(`Pedido/assunto sensível detectado: "${userText.slice(0, 90)}"`);
      break;
    case 'book': {
      flow.step = 'await_slot'; flow.spec = spec;
      const slots = availableSlots(0, 3);
      result.slots = slots;
      sayR('slots', { slots: slots.map(s => s.label).join(' · '), price: { __m: spec.price } });
      result.actions.push('offer_slots');
      if (!opts.noSideEffects && !state.funnel.flatMap(c => c.items).find(i => i.chatId === chat.id)) {
        addLead('lead', { name: chat.name, value: spec.price, desc: `Interesse em ${spec.name}`, chatId: chat.id });
        addActivity('ev.lead', { name: chat.name, type: spec.name }, 'users');
      }
      break;
    }
    default:
      mem.fallback += 1;
      if (mem.fallback >= 2) handoff(`IA não compreendeu após ${mem.fallback} tentativas: "${userText.slice(0, 90)}"`);
      else sayT('sophia.clarify');
  }
  return result;
}

function intentLabel(intent) {
  const map = {
    greeting: 'Saudação', specialties: 'Especialidades', health: 'Sintomas (sem diagnóstico)',
    price: 'Preços', hours: 'Horários', location: 'Localização', insurance: 'Convênios',
    payment: 'Pagamento', escalate: 'Escalonamento', book: 'Agendamento', thanks: 'Agradecimento', emergency: 'Emergência', fallback: 'Geral'
  };
  return map[intent] || 'Geral';
}

/* Envia resposta com efeito de digitação; retorna Promise */
export function sophiaReplyToChat(chatId, userText, delay = 1100) {
  return new Promise(resolve => {
    const chat = getChat(chatId);
    if (!chat) return resolve(null);
    setTimeout(() => {
      const res = sophiaRespond(chat, userText);
      addMessage(chatId, { sender: 'sophia', text: res.text, ssrc: res.ssrc, skey: res.skey, sparams: res.sparams, kind: res.booking ? 'booking' : undefined, data: res.booking });
      resolve(res);
    }, delay);
  });
}

/* =====================================================================
   AGENTE INTERNO — o "gerente" que responde com dados do estado
   ===================================================================== */
export function internalAgentAnswer(query) {
  const q = query.toLowerCase();
  const lang = getLang();
  const today = todayAppointments();
  const revenueToday = today.reduce((s, a) => s + (state.apptTypes.find(t => t.id === a.type)?.price || 0), 0);
  const monthRevenue = state.metrics.days.slice(-30).reduce((s, d) => s + d.revenue, 0);
  const chats7 = state.metrics.days.slice(-7).reduce((s, d) => s + d.chats, 0);
  const books7 = state.metrics.days.slice(-7).reduce((s, d) => s + d.bookings, 0);
  const conv = chats7 ? Math.round(books7 / chats7 * 100) : 0;
  const waiting = state.queue.filter(x => x.status === 'waiting').length;
  const breached = state.queue.filter(x => x.seconds < 0).length;
  const needs = state.issues.length;
  const pipeline = funnelTotal(['lead', 'qualified', 'scheduled', 'confirmed']);
  const won = funnelTotal(['done']);

  const L = (pt, en, es, fr) => ({ pt, en, es, fr }[lang]);

  if (/faturamento|receita|vendas|revenue|sales|ingresos|revenu|ventes|dinheiro/.test(q)) {
    return L(
      `📊 Faturamento estimado do mês: ${money(monthRevenue)}. Só hoje são ${today.length} consultas, somando ${money(revenueToday)}. O pipeline aberto no funil soma ${money(pipeline)} e já realizamos ${money(won)} em procedimentos. Ticket médio: ${money(Math.round(monthRevenue / 46))}. Quer que eu detalhe por especialidade?`,
      `📊 Estimated monthly revenue: ${money(monthRevenue)}. Today alone: ${today.length} appointments totaling ${money(revenueToday)}. Open pipeline: ${money(pipeline)}; completed procedures: ${money(won)}. Average ticket: ${money(Math.round(monthRevenue / 46))}. Want a breakdown by specialty?`,
      `📊 Ingresos estimados del mes: ${money(monthRevenue)}. Solo hoy: ${today.length} citas por ${money(revenueToday)}. Pipeline abierto: ${money(pipeline)}; procedimientos realizados: ${money(won)}. Ticket medio: ${money(Math.round(monthRevenue / 46))}. ¿Lo detallo por especialidad?`,
      `📊 Revenu mensuel estimé : ${money(monthRevenue)}. Aujourd’hui : ${today.length} consultations pour ${money(revenueToday)}. Pipeline ouvert : ${money(pipeline)} ; actes réalisés : ${money(won)}. Panier moyen : ${money(Math.round(monthRevenue / 46))}. Je détaille par spécialité ?`
    );
  }
  if (/convers|taxa|desempenho|conversion|rate|performance|conversi|taux/.test(q)) {
    return L(
      `🎯 Conversão de leads em agendamentos nos últimos 7 dias: ${conv}% (${books7} de ${chats7} conversas). A Sophia resolveu ${state.counters.solvedPct}% dos atendimentos sozinha, com 1ª resposta média de ${state.counters.avgResponse}s. O gargalo atual: ${needs} caso(s) aguardando humano — cada hora de espera reduz a conversão em ~8%.`,
      `🎯 Lead-to-booking conversion (last 7 days): ${conv}% (${books7} of ${chats7} chats). Sophia handled ${state.counters.solvedPct}% alone, avg first response ${state.counters.avgResponse}s. Current bottleneck: ${needs} case(s) awaiting a human — each hour of wait cuts conversion by ~8%.`,
      `🎯 Conversión de leads (últimos 7 días): ${conv}% (${books7} de ${chats7} chats). Sophia resolvió ${state.counters.solvedPct}% sola, 1ª respuesta media ${state.counters.avgResponse}s. Cuello de botella: ${needs} caso(s) esperando humano — cada hora de espera reduce ~8% la conversión.`,
      `🎯 Conversion lead→RDV (7 jours) : ${conv}% (${books7} sur ${chats7}). Sophia a géré ${state.counters.solvedPct}% seule, 1re réponse en ${state.counters.avgResponse}s. Goulot : ${needs} cas en attente d’humain — chaque heure d’attente coûte ~8% de conversion.`
    );
  }
  if (/fila|espera|queue|waiting|cola|file|attente|sla/.test(q)) {
    const worst = [...state.queue].sort((a, b) => a.seconds - b.seconds)[0];
    return L(
      `⏱️ Fila agora: ${state.queue.length} contatos, ${waiting} aguardando primeira resposta e ${breached} com SLA estourado (>15 min). Caso mais crítico: ${worst ? worst.name + ' (' + Math.max(0, Math.round((SLA_SECONDS - worst.seconds) / 60)) + ' min de espera)' : '—'}. ${needs} item(ns) em "Precisa de você". Recomendo assumir os de prioridade alta primeiro.`,
      `⏱️ Queue now: ${state.queue.length} contacts, ${waiting} awaiting first reply, ${breached} breached (>15 min). Most critical: ${worst ? worst.name : '—'}. ${needs} item(s) in "Needs you". I suggest taking high-priority ones first.`,
      `⏱️ Cola ahora: ${state.queue.length} contactos, ${waiting} esperando respuesta, ${breached} con SLA excedido. Más crítico: ${worst ? worst.name : '—'}. ${needs} elemento(s) en "Requiere de ti". Recomiendo los de prioridad alta primero.`,
      `⏱️ File : ${state.queue.length} contacts, ${waiting} en attente, ${breached} hors SLA. Plus critique : ${worst ? worst.name : '—'}. ${needs} point(s) dans « Besoin de vous ». Priorisez les urgents.`
    );
  }
  if (/m[ée]dico|doutor|agenda|hor[áa]rio|livre|doctor|schedule|free|agenda|dispo/.test(q)) {
    const busiest = today.length;
    return L(
      `🗓️ Hoje temos ${busiest} consultas (${today.filter(a => a.status === 'confirmed').length} confirmadas). A Dra. Juliana Paes tem 2 horários livres à tarde; o Dr. Carlos Eduardo está 90% ocupado. Amanhã há ${availableSlots(1, 5).length}+ vagas a partir das 07h. Quer que a Sophia ofereça esses horários aos leads em negociação?`,
      `🗓️ Today: ${busiest} appointments (${today.filter(a => a.status === 'confirmed').length} confirmed). Dr. Juliana Paes has 2 free afternoon slots; Dr. Carlos Eduardo is 90% booked. Tomorrow has ${availableSlots(1, 5).length}+ openings from 7:00. Should Sophia offer these to leads in negotiation?`,
      `🗓️ Hoy: ${busiest} citas (${today.filter(a => a.status === 'confirmed').length} confirmadas). Juliana Paes tiene 2 huecos por la tarde; Carlos Eduardo está al 90%. Mañana hay ${availableSlots(1, 5).length}+ plazas desde las 07. ¿Sophia las ofrece a los leads?`,
      `🗓️ Aujourd’hui : ${busiest} consultations (${today.filter(a => a.status === 'confirmed').length} confirmées). Juliana Paes a 2 créneaux l’après-midi ; Carlos Eduardo est à 90%. Demain : ${availableSlots(1, 5).length}+ créneaux dès 7h. Sophia les propose aux leads ?`
    );
  }
  if (/perd|perda|lost|gargalo|pierdo|perds|probl|problem/.test(q)) {
    const lost = state.funnel.find(c => c.id === 'lost');
    const lostValue = lost.items.reduce((s, i) => s + i.value, 0);
    return L(
      `🔎 Estamos perdendo vendas em 3 pontos: (1) ${lost.items.length} lead(s) no estágio "Perdido" (${money(lostValue)}) — motivo principal: preço; (2) ${needs} escalonamentos sem resposta — resposta rápida recuperaria ~30%; (3) leads sem follow-up após 48h. Ação recomendada: ativar follow-up automático e responder os itens de "Precisa de você" agora. Posso preparar a lista?`,
      `🔎 We're losing sales at 3 points: (1) ${lost.items.length} lost lead(s) (${money(lostValue)}) — main reason: price; (2) ${needs} unanswered escalations — fast replies could recover ~30%; (3) leads without 48h follow-up. Recommended: enable auto follow-up and clear "Needs you" now. Shall I prepare the list?`,
      `🔎 Perdemos ventas en 3 puntos: (1) ${lost.items.length} lead(s) perdidos (${money(lostValue)}) — motivo: precio; (2) ${needs} escalados sin respuesta — responder rápido recupera ~30%; (3) leads sin seguimiento 48h. Recomiendo activar follow-up y limpiar "Requiere de ti". ¿Preparo la lista?`,
      `🔎 Pertes à 3 niveaux : (1) ${lost.items.length} lead(s) perdu(s) (${money(lostValue)}) — prix ; (2) ${needs} escalades sans réponse — répondre vite récupère ~30% ; (3) leads sans relance 48h. Activez la relance auto et videz « Besoin de vous ». Je prépare la liste ?`
    );
  }
  if (/resumo|hoje|today|summary|resumen|r[ée]sum[ée]|dia/.test(q)) {
    return L(
      `☀️ Resumo do dia: ${today.length} consultas (${money(revenueToday)} previstos), ${state.counters.chatsToday} conversas no WhatsApp, SLA médio de ${state.counters.avgResponse}s e ${needs} pendência(s) para você. Conversão da semana: ${conv}%. Sophia está ${state.autopilot ? 'no piloto automático ✅' : 'pausada ⚠️ — reative para não perder leads'}. Destaque: Odontologia lidera a procura hoje.`,
      `☀️ Today: ${today.length} appointments (${money(revenueToday)} expected), ${state.counters.chatsToday} WhatsApp chats, avg SLA ${state.counters.avgResponse}s, ${needs} pending item(s) for you. Weekly conversion: ${conv}%. Sophia is ${state.autopilot ? 'on autopilot ✅' : 'paused ⚠️ — re-enable to avoid losing leads'}. Dentistry leads demand today.`,
      `☀️ Resumen: ${today.length} citas (${money(revenueToday)} previstos), ${state.counters.chatsToday} chats, SLA medio ${state.counters.avgResponse}s, ${needs} pendiente(s). Conversión semanal: ${conv}%. Sophia está ${state.autopilot ? 'en piloto automático ✅' : 'pausada ⚠️'}. Odontología lidera hoy.`,
      `☀️ Résumé : ${today.length} RDV (${money(revenueToday)} prévus), ${state.counters.chatsToday} conversations, SLA moyen ${state.counters.avgResponse}s, ${needs} point(s) en attente. Conversion hebdo : ${conv}%. Sophia est ${state.autopilot ? 'en pilote auto ✅' : 'en pause ⚠️'}. La dentisterie domine aujourd’hui.`
    );
  }
  return L(
    `Boa pergunta! Cruzando os dados: hoje temos ${today.length} consultas (${money(revenueToday)}), conversão semanal de ${conv}%, ${state.queue.length} contatos na fila e ${money(pipeline)} em pipeline. A Sophia resolve ${state.counters.solvedPct}% sozinha. Posso detalhar faturamento, conversão, fila, agenda ou onde você perde vendas — é só perguntar.`,
    `Good question! Cross-referencing: today ${today.length} appointments (${money(revenueToday)}), weekly conversion ${conv}%, ${state.queue.length} contacts in queue, ${money(pipeline)} in pipeline. Sophia handles ${state.counters.solvedPct}% alone. Ask me about revenue, conversion, queue, schedule or lost sales.`,
    `¡Buena pregunta! Cruzando datos: hoy ${today.length} citas (${money(revenueToday)}), conversión semanal ${conv}%, ${state.queue.length} en cola y ${money(pipeline)} en pipeline. Sophia resuelve ${state.counters.solvedPct}% sola. Pregúntame por ingresos, conversión, cola, agenda o pérdidas.`,
    `Bonne question ! En croisant : aujourd’hui ${today.length} RDV (${money(revenueToday)}), conversion hebdo ${conv}%, ${state.queue.length} en file, ${money(pipeline)} en pipeline. Sophia gère ${state.counters.solvedPct}% seule. Interrogez-moi sur revenus, conversion, file, planning ou pertes.`
  );
}
