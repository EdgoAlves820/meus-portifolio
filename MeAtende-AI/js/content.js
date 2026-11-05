/* =====================================================================
   MeAtende AI — content.js
   Tradução do CONTEÚDO de demonstração (conversas, agenda, funil, base de
   conhecimento, etc.) para o idioma ativo. `loc(text)` traduz strings PT
   conhecidas; `ct(key)` traduz conteúdo gerado pela IA (chave i18n).
   ===================================================================== */
import { getLang, t } from './i18n.js';

const IDX = { pt: 0, en: 1, es: 2, fr: 3 };

/* [pt, en, es, fr] — o texto PT é a "chave" reversa usada por loc() */
const CT = {
  /* Especialidades / tags / tipos (palavras soltas) */
  'Odontologia': ['Odontologia', 'Dentistry', 'Odontología', 'Dentisterie'],
  'Dermatologia': ['Dermatologia', 'Dermatology', 'Dermatología', 'Dermatologie'],
  'Clínica Geral': ['Clínica Geral', 'General Practice', 'Clínica General', 'Médecine générale'],
  'Cardiologia': ['Cardiologia', 'Cardiology', 'Cardiología', 'Cardiologie'],
  'Ortopedia': ['Ortopedia', 'Orthopedics', 'Ortopedia', 'Orthopédie'],
  'Fisioterapia': ['Fisioterapia', 'Physiotherapy', 'Fisioterapia', 'Kinésithérapie'],
  'Nutrição': ['Nutrição', 'Nutrition', 'Nutrición', 'Nutrition'],
  'Oftalmologia': ['Oftalmologia', 'Ophthalmology', 'Oftalmología', 'Ophtalmologie'],
  'Ginecologia': ['Ginecologia', 'Gynecology', 'Ginecología', 'Gynécologie'],
  'Pediatria': ['Pediatria', 'Pediatrics', 'Pediatría', 'Pédiatrie'],
  'Otorrinolaringologia': ['Otorrinolaringologia', 'ENT', 'Otorrinolaringología', 'ORL'],
  'Endocrinologia': ['Endocrinologia', 'Endocrinology', 'Endocrinología', 'Endocrinologie'],
  'Gastroenterologia': ['Gastroenterologia', 'Gastroenterology', 'Gastroenterología', 'Gastro-entérologie'],
  'Urologia': ['Urologia', 'Urology', 'Urología', 'Urologie'],
  'Psicologia': ['Psicologia', 'Psychology', 'Psicología', 'Psychologie'],
  'Psiquiatria': ['Psiquiatria', 'Psychiatry', 'Psiquiatría', 'Psychiatrie'],
  'Financeiro': ['Financeiro', 'Billing', 'Financiero', 'Facturation'],
  'Triagem': ['Triagem', 'Triage', 'Triaje', 'Triage'],
  'Preço': ['Preço', 'Price', 'Precio', 'Prix'],
  'Convênio': ['Convênio', 'Insurance', 'Seguro', 'Assurance'],
  'Retorno': ['Retorno', 'Follow-up', 'Revisión', 'Suivi'],
  'Urgente': ['Urgente', 'Urgent', 'Urgente', 'Urgent'],
  'Primeira consulta': ['Primeira consulta', 'First visit', 'Primera consulta', 'Première consultation'],
  'Preços': ['Preços', 'Prices', 'Precios', 'Tarifs'],
  'Horários': ['Horários', 'Hours', 'Horarios', 'Horaires'],
  'Localização': ['Localização', 'Location', 'Ubicación', 'Localisation'],
  'Convênios': ['Convênios', 'Insurance', 'Seguros', 'Assurances'],
  'Políticas': ['Políticas', 'Policies', 'Políticas', 'Politiques'],
  'Serviços': ['Serviços', 'Services', 'Servicios', 'Services'],
  'Geral': ['Geral', 'General', 'General', 'Général'],
  'Preparo': ['Preparo', 'Preparation', 'Preparación', 'Préparation'],
  'Pagamento': ['Pagamento', 'Payment', 'Pago', 'Paiement'],
  'Acessibilidade': ['Acessibilidade', 'Accessibility', 'Accesibilidad', 'Accessibilité'],
  'Segurança': ['Segurança', 'Safety', 'Seguridad', 'Sécurité'],
  'Exames': ['Exames', 'Tests', 'Exámenes', 'Examens'],
  'Privacidade': ['Privacidade', 'Privacy', 'Privacidad', 'Confidentialité'],

  /* Intenções */
  'Agendamento — Odontologia': ['Agendamento — Odontologia', 'Booking — Dentistry', 'Cita — Odontología', 'RDV — Dentisterie'],
  'Preço — Limpeza dental': ['Preço — Limpeza dental', 'Price — Dental cleaning', 'Precio — Limpieza dental', 'Prix — Détartrage'],
  'Convênio + desconto especial': ['Convênio + desconto especial', 'Insurance + special discount', 'Seguro + descuento especial', 'Assurance + remise spéciale'],
  'Informação — Nutrição': ['Informação — Nutrição', 'Info — Nutrition', 'Información — Nutrición', 'Info — Nutrition'],
  'Confirmação de consulta': ['Confirmação de consulta', 'Appointment confirmation', 'Confirmación de cita', 'Confirmation de RDV'],
  'Reclamação — cobrança': ['Reclamação — cobrança', 'Complaint — billing', 'Queja — cobro', 'Plainte — facturation'],
  'Saudação': ['Saudação', 'Greeting', 'Saludo', 'Salutation'],
  'Especialidades': ['Especialidades', 'Specialties', 'Especialidades', 'Spécialités'],
  'Sintomas (sem diagnóstico)': ['Sintomas (sem diagnóstico)', 'Symptoms (no diagnosis)', 'Síntomas (sin diagnóstico)', 'Symptômes (sans diagnostic)'],
  'Localização ': ['Localização', 'Location', 'Ubicación', 'Localisation'],
  'Escalonamento': ['Escalonamento', 'Escalation', 'Escalado', 'Escalade'],
  'Emergência': ['Emergência', 'Emergency', 'Emergencia', 'Urgence'],
  'Neurologia': ['Neurologia', 'Neurology', 'Neurología', 'Neurologie'],
  'Reumatologia': ['Reumatologia', 'Rheumatology', 'Reumatología', 'Rhumatologie'],
  'Pneumologia': ['Pneumologia', 'Pulmonology', 'Neumología', 'Pneumologie'],
  'Nefrologia': ['Nefrologia', 'Nephrology', 'Nefrología', 'Néphrologie'],
  'Geriatria': ['Geriatria', 'Geriatrics', 'Geriatría', 'Gériatrie'],
  'Alergologia e Imunologia': ['Alergologia e Imunologia', 'Allergy & Immunology', 'Alergología e Inmunología', 'Allergologie et Immunologie'],
  'Obstetrícia': ['Obstetrícia', 'Obstetrics', 'Obstetricia', 'Obstétrique'],
  'Ginecologia / Obstetrícia': ['Ginecologia / Obstetrícia', 'Gynecology / Obstetrics', 'Ginecología / Obstetricia', 'Gynécologie / Obstétrique'],
  'Reumatologia / Geriatria': ['Reumatologia / Geriatria', 'Rheumatology / Geriatrics', 'Reumatología / Geriatría', 'Rhumatologie / Gériatrie'],
  'Pneumologia / Alergologia e Imunologia': ['Pneumologia / Alergologia e Imunologia', 'Pulmonology / Allergy & Immunology', 'Neumología / Alergología', 'Pneumologie / Allergologie'],
  'Nefrologia / Urologia': ['Nefrologia / Urologia', 'Nephrology / Urology', 'Nefrología / Urología', 'Néphrologie / Urologie'],
  'Gastroenterologia / Endocrinologia': ['Gastroenterologia / Endocrinologia', 'Gastroenterology / Endocrinology', 'Gastroenterología / Endocrinología', 'Gastro-entérologie / Endocrinologie'],
  'Oftalmologia / Otorrinolaringologia': ['Oftalmologia / Otorrinolaringologia', 'Ophthalmology / ENT', 'Oftalmología / Otorrinolaringología', 'Ophtalmologie / ORL'],
  'Agendamento': ['Agendamento', 'Booking', 'Agendamiento', 'Réservation'],
  'Agradecimento': ['Agradecimento', 'Thanks', 'Agradecimiento', 'Remerciement'],

  /* Mensagens das conversas (seed) */
  'Olá, gostaria de saber se vocês têm atendimento odontológico e cardiologia?': ['Olá, gostaria de saber se vocês têm atendimento odontológico e cardiologia?', 'Hi, do you offer dentistry and cardiology?', 'Hola, ¿tienen atención de odontología y cardiología?', 'Bonjour, proposez-vous la dentisterie et la cardiologie ?'],
  'Olá, Ana Beatriz! 👋 Sou a Sophia, assistente da Clínica Vida Plena. Sim! Temos especialistas em Odontologia e Cardiologia, além de outras 14 áreas. Deseja agendar uma avaliação para qual delas?': ['Olá, Ana Beatriz! 👋 Sou a Sophia, assistente da Clínica Vida Plena. Sim! Temos especialistas em Odontologia e Cardiologia, além de outras 14 áreas. Deseja agendar uma avaliação para qual delas?', 'Hi, Ana Beatriz! 👋 I\'m Sophia, from Vida Plena Clinic. Yes! We have Dentistry and Cardiology specialists, plus 14 other areas. Which one would you like to book?', '¡Hola, Ana Beatriz! 👋 Soy Sophia, de la Clínica Vida Plena. ¡Sí! Tenemos Odontología y Cardiología, además de otras 14 áreas. ¿Para cuál deseas agendar?', 'Bonjour, Ana Beatriz ! 👋 Je suis Sophia, de la Clinique Vida Plena. Oui ! Nous avons la Dentisterie et la Cardiologie, plus 14 autres domaines. Pour lequel souhaitez-vous réserver ?'],
  'Odontologia, por favor. Pode ser hoje à tarde?': ['Odontologia, por favor. Pode ser hoje à tarde?', 'Dentistry, please. Could it be this afternoon?', 'Odontología, por favor. ¿Puede ser hoy por la tarde?', 'Dentisterie, s’il vous plaît. Cet après-midi ?'],
  'Perfeito! Hoje tenho 14h30 e 15h45 com a Dra. Juliana Paes. A avaliação odontológica é R$ 180 com retorno incluso. Qual horário prefere?': ['Perfeito! Hoje tenho 14h30 e 15h45 com a Dra. Juliana Paes. A avaliação odontológica é R$ 180 com retorno incluso. Qual horário prefere?', 'Perfect! Today I have 2:30 PM and 3:45 PM with Dr. Juliana Paes. The dental evaluation is R$180 with follow-up included. Which time do you prefer?', '¡Perfecto! Hoy tengo 14:30 y 15:45 con la Dra. Juliana Paes. La evaluación odontológica cuesta 180 R$ con revisión incluida. ¿Qué horario prefieres?', 'Parfait ! Aujourd’hui j’ai 14h30 et 15h45 avec Dre Juliana Paes. L’évaluation dentaire est à 180 R$, suivi inclus. Quel horaire préférez-vous ?'],
  'Pode ser 14h30!': ['Pode ser 14h30!', '2:30 PM works!', '¡Puede ser 14:30!', '14h30 me va !'],
  'Agendado! ✅ Odontologia com a Dra. Juliana Paes, hoje às 14h30. Enviarei um lembrete 1h antes. Posso ajudar em algo mais?': ['Agendado! ✅ Odontologia com a Dra. Juliana Paes, hoje às 14h30. Enviarei um lembrete 1h antes. Posso ajudar em algo mais?', 'Booked! ✅ Dentistry with Dr. Juliana Paes, today at 2:30 PM. I\'ll send a reminder 1h before. Anything else I can help with?', '¡Agendado! ✅ Odontología con la Dra. Juliana Paes, hoy a las 14:30. Enviaré un recordatorio 1h antes. ¿Puedo ayudar en algo más?', 'Réservé ! ✅ Dentisterie avec Dre Juliana Paes, aujourd’hui à 14h30. J’enverrai un rappel 1h avant. Puis-je aider autre chose ?'],
  'Queria saber o preço da limpeza dentária.': ['Queria saber o preço da limpeza dentária.', 'I\'d like to know the price of a dental cleaning.', 'Quería saber el precio de la limpieza dental.', 'Je voudrais connaître le prix du détartrage.'],
  'Olá, Lucas! Nossa limpeza dentária + avaliação sai a partir de R$ 150, com retorno incluso. 😊 Quer que eu verifique os horários desta semana?': ['Olá, Lucas! Nossa limpeza dentária + avaliação sai a partir de R$ 150, com retorno incluso. 😊 Quer que eu verifique os horários desta semana?', 'Hi, Lucas! Our dental cleaning + evaluation starts at R$150, with follow-up included. 😊 Shall I check this week\'s slots?', '¡Hola, Lucas! Nuestra limpieza dental + evaluación empieza en 150 R$, con revisión incluida. 😊 ¿Reviso los horarios de esta semana?', 'Bonjour, Lucas ! Notre détartrage + évaluation commence à 150 R$, suivi inclus. 😊 Je vérifie les créneaux de cette semaine ?'],
  'Quero sim, de preferência amanhã cedo': ['Quero sim, de preferência amanhã cedo', 'Yes please, preferably tomorrow morning', 'Sí, de preferencia mañana temprano', 'Oui, de préférence demain matin'],
  'Estou com uma dúvida sobre desconto em pacote dermatológico e plano de saúde.': ['Estou com uma dúvida sobre desconto em pacote dermatológico e plano de saúde.', 'I have a question about a discount on a dermatology package and health insurance.', 'Tengo una duda sobre descuento en paquete dermatológico y seguro médico.', 'J’ai une question sur une remise forfait dermatologie et assurance santé.'],
  'Entendi, Carla! Para condições especiais de pacotes e convênios, vou transferir você para nossa equipe humana, que consegue negociar a melhor condição. Um momento, por favor. 🙏': ['Entendi, Carla! Para condições especiais de pacotes e convênios, vou transferir você para nossa equipe humana, que consegue negociar a melhor condição. Um momento, por favor. 🙏', 'Got it, Carla! For special package and insurance conditions, I\'ll transfer you to our human team, who can negotiate the best deal. One moment, please. 🙏', '¡Entendido, Carla! Para condiciones especiales de paquetes y seguros, te transfiero a nuestro equipo humano, que negocia la mejor condición. Un momento, por favor. 🙏', 'Compris, Carla ! Pour les conditions spéciales forfaits et assurances, je vous transfère à notre équipe humaine, qui négocie au mieux. Un instant, s’il vous plaît. 🙏'],
  'Sophia transferiu a conversa para atendimento humano (confiança 46% — regra: convênios e descontos >15%).': ['Sophia transferiu a conversa para atendimento humano (confiança 46% — regra: convênios e descontos >15%).', 'Sophia transferred the chat to a human (confidence 46% — rule: insurance and discounts >15%).', 'Sophia transfirió el chat a un humano (confianza 46% — regla: seguros y descuentos >15%).', 'Sophia a transféré à un humain (confiance 46% — règle : assurances et remises >15%).'],
  'Quais dias a nutricionista atende?': ['Quais dias a nutricionista atende?', 'Which days does the nutritionist work?', '¿Qué días atiende la nutricionista?', 'Quels jours la nutritionniste consulte-t-elle ?'],
  'Olá, Fernando! A Dra. Paula Nunes (Nutrição) atende de segunda a sexta, 07h–16h30, e sábado 08h–13h. A consulta é R$ 220 com plano alimentar. Qual dia fica melhor para você?': ['Olá, Fernando! A Dra. Paula Nunes (Nutrição) atende de segunda a sexta, 07h–16h30, e sábado 08h–13h. A consulta é R$ 220 com plano alimentar. Qual dia fica melhor para você?', 'Hi, Fernando! Dr. Paula Nunes (Nutrition) works Mon–Fri 7:00–16:30 and Sat 8:00–13:00. The visit is R$220 with a meal plan. Which day suits you best?', '¡Hola, Fernando! La Dra. Paula Nunes (Nutrición) atiende lun–vie 07–16:30 y sáb 08–13. La consulta cuesta 220 R$ con plan alimenticio. ¿Qué día te viene mejor?', 'Bonjour, Fernando ! Dre Paula Nunes (Nutrition) consulte lun–ven 7h–16h30 et sam 8h–13h. La consultation est à 220 R$ avec plan alimentaire. Quel jour vous convient ?'],
  'Oi, Mariana! Passando para confirmar sua consulta de Dermatologia hoje às 09h00 com o Dr. Carlos Eduardo. Podemos confirmar? ✅': ['Oi, Mariana! Passando para confirmar sua consulta de Dermatologia hoje às 09h00 com o Dr. Carlos Eduardo. Podemos confirmar? ✅', 'Hi, Mariana! Just confirming your Dermatology appointment today at 9:00 AM with Dr. Carlos Eduardo. Shall we confirm? ✅', '¡Hola, Mariana! Para confirmar tu cita de Dermatología hoy a las 09:00 con el Dr. Carlos Eduardo. ¿Confirmamos? ✅', 'Bonjour, Mariana ! Je confirme votre RDV de Dermatologie aujourd’hui à 9h00 avec Dr Carlos Eduardo. On confirme ? ✅'],
  'Confirmado! Estarei aí.': ['Confirmado! Estarei aí.', 'Confirmed! I\'ll be there.', '¡Confirmado! Estaré ahí.', 'Confirmé ! Je serai là.'],
  'Maravilha! Consulta confirmada. Chegue com 10 minutinhos de antecedência, por favor. Até logo! 💚': ['Maravilha! Consulta confirmada. Chegue com 10 minutinhos de antecedência, por favor. Até logo! 💚', 'Great! Appointment confirmed. Please arrive 10 minutes early. See you soon! 💚', '¡Genial! Cita confirmada. Llega 10 minutos antes, por favor. ¡Hasta luego! 💚', 'Super ! RDV confirmé. Arrivez 10 minutes en avance, s’il vous plaît. À bientôt ! 💚'],
  'Fui cobrado duas vezes pela consulta de ontem. Quero resolver isso hoje.': ['Fui cobrado duas vezes pela consulta de ontem. Quero resolver isso hoje.', 'I was charged twice for yesterday\'s appointment. I want to resolve this today.', 'Me cobraron dos veces por la cita de ayer. Quiero resolverlo hoy.', 'J’ai été facturé deux fois pour la consultation d’hier. Je veux régler cela aujourd’hui.'],
  'Sinto muito pelo transtorno, Roberto. Cobranças em duplicidade são tratadas pela nossa equipe financeira com prioridade. Já estou chamando um atendente humano. 🙏': ['Sinto muito pelo transtorno, Roberto. Cobranças em duplicidade são tratadas pela nossa equipe financeira com prioridade. Já estou chamando um atendente humano. 🙏', 'I\'m sorry for the trouble, Roberto. Duplicate charges are handled by our finance team with priority. I\'m calling a human agent now. 🙏', 'Lamento el inconveniente, Roberto. Los cobros duplicados los trata nuestro equipo financiero con prioridad. Ya llamo a un agente humano. 🙏', 'Désolée pour le désagrément, Roberto. Les doubles facturations sont traitées en priorité par notre équipe financière. J’appelle un agent humain. 🙏'],
  'Escalonado automaticamente: assunto financeiro sensível (regra do playbook).': ['Escalonado automaticamente: assunto financeiro sensível (regra do playbook).', 'Auto-escalated: sensitive financial matter (playbook rule).', 'Escalado automáticamente: asunto financiero sensible (regla del playbook).', 'Escaladé automatiquement : sujet financier sensible (règle du playbook).'],
  'Aguardo. Preciso do estorno ainda hoje.': ['Aguardo. Preciso do estorno ainda hoje.', 'I\'ll wait. I need the refund today.', 'Espero. Necesito el reembolso hoy.', 'J’attends. J’ai besoin du remboursement aujourd’hui.'],

  /* Funil */
  'Primeira consulta geral': ['Primeira consulta geral', 'First general visit', 'Primera consulta general', 'Première consultation générale'],
  'Interesse em Nutrição': ['Interesse em Nutrição', 'Interested in Nutrition', 'Interés en Nutrición', 'Intérêt pour la Nutrition'],
  'Cotando limpeza dental': ['Cotando limpeza dental', 'Quoting dental cleaning', 'Cotizando limpieza dental', 'Devis détartrage'],
  'Pacote dermatológico + convênio': ['Pacote dermatológico + convênio', 'Dermatology package + insurance', 'Paquete dermatológico + seguro', 'Forfait dermatologie + assurance'],
  'Odontologia hoje 14h30': ['Odontologia hoje 14h30', 'Dentistry today 2:30 PM', 'Odontología hoy 14:30', 'Dentisterie aujourd’hui 14h30'],
  'Cardiologia amanhã 10h': ['Cardiologia amanhã 10h', 'Cardiology tomorrow 10 AM', 'Cardiología mañana 10h', 'Cardiologie demain 10h'],
  'Ortopedia quinta 14h': ['Ortopedia quinta 14h', 'Orthopedics Thursday 2 PM', 'Ortopedia jueves 14h', 'Orthopédie jeudi 14h'],
  'Dermatologia hoje 09h — confirmada': ['Dermatologia hoje 09h — confirmada', 'Dermatology today 9 AM — confirmed', 'Dermatología hoy 09h — confirmada', 'Dermatologie aujourd’hui 9h — confirmée'],
  'Pacote fisioterapia — confirmado': ['Pacote fisioterapia — confirmado', 'Physiotherapy package — confirmed', 'Paquete fisioterapia — confirmado', 'Forfait kinésithérapie — confirmé'],
  'Procedimento finalizado': ['Procedimento finalizado', 'Procedure completed', 'Procedimiento finalizado', 'Acte terminé'],
  'Clínica geral — realizado 07h30': ['Clínica geral — realizado 07h30', 'General practice — done 7:30 AM', 'Clínica general — realizado 07:30', 'Médecine générale — effectué 7h30'],
  'Preferiu concorrente por preço': ['Preferiu concorrente por preço', 'Chose a competitor on price', 'Prefirió competidor por precio', 'A choisi un concurrent sur le prix'],

  /* Pendências */
  'Convênio não cadastrado + desconto de pacote acima de 15% (fora da alçada da IA).': ['Convênio não cadastrado + desconto de pacote acima de 15% (fora da alçada da IA).', 'Unlisted insurance + package discount above 15% (beyond AI authority).', 'Seguro no registrado + descuento de paquete >15% (fuera del alcance de la IA).', 'Assurance non répertoriée + remise forfait >15% (hors périmètre IA).'],
  'Carla, consegui verificar com a gerência: para o pacote dermatológico fechado conseguimos 12% à vista no Pix, e seu convênio cobre a consulta inicial. Posso montar a proposta?': ['Carla, consegui verificar com a gerência: para o pacote dermatológico fechado conseguimos 12% à vista no Pix, e seu convênio cobre a consulta inicial. Posso montar a proposta?', 'Carla, I checked with management: for the full dermatology package we can offer 12% off via Pix, and your insurance covers the initial visit. Shall I prepare the proposal?', 'Carla, lo verifiqué con gerencia: para el paquete dermatológico completo ofrecemos 12% por Pix, y tu seguro cubre la consulta inicial. ¿Preparo la propuesta?', 'Carla, j’ai vérifié avec la direction : pour le forfait dermatologie complet, 12% via Pix, et votre assurance couvre la première consultation. Je prépare la proposition ?'],
  'Cobrança em duplicidade — estorno exige aprovação humana do financeiro.': ['Cobrança em duplicidade — estorno exige aprovação humana do financeiro.', 'Duplicate charge — refund requires human finance approval.', 'Cobro duplicado — el reembolso requiere aprobación humana.', 'Double facturation — le remboursement exige une validation humaine.'],
  'Roberto, identifiquei a cobrança duplicada de R$ 250. O estorno via Pix pode ser feito em até 2h úteis. Confirma a chave do seu telefone para devoluções?': ['Roberto, identifiquei a cobrança duplicada de R$ 250. O estorno via Pix pode ser feito em até 2h úteis. Confirma a chave do seu telefone para devoluções?', 'Roberto, I identified the duplicate charge of R$250. The Pix refund can be done within 2 business hours. Do you confirm your phone key for refunds?', 'Roberto, identifiqué el cobro duplicado de 250 R$. El reembolso por Pix puede hacerse en 2h hábiles. ¿Confirmas tu clave de teléfono?', 'Roberto, j’ai identifié le double prélèvement de 250 R$. Le remboursement Pix peut être fait sous 2h ouvrées. Confirmez-vous votre clé téléphone ?'],

  /* Tipos de consulta */
  'Odontologia — Avaliação': ['Odontologia — Avaliação', 'Dentistry — Evaluation', 'Odontología — Evaluación', 'Dentisterie — Évaluation'],
  'Fisioterapia (sessão)': ['Fisioterapia (sessão)', 'Physiotherapy (session)', 'Fisioterapia (sesión)', 'Kinésithérapie (séance)'],

  /* Base de conhecimento (existente) */
  'Quanto custa a consulta?': ['Quanto custa a consulta?', 'How much is the appointment?', '¿Cuánto cuesta la consulta?', 'Combien coûte la consultation ?'],
  'Consultas a partir de R$ 150 (clínica geral). Odontologia R$ 180, Dermatologia R$ 350, Cardiologia R$ 600, Nutrição R$ 220. Retorno em até 30 dias incluso.': ['Consultas a partir de R$ 150 (clínica geral). Odontologia R$ 180, Dermatologia R$ 350, Cardiologia R$ 600, Nutrição R$ 220. Retorno em até 30 dias incluso.', 'Appointments from R$150 (general practice). Dentistry R$180, Dermatology R$350, Cardiology R$600, Nutrition R$220. Follow-up within 30 days included.', 'Consultas desde 150 R$ (clínica general). Odontología 180 R$, Dermatología 350 R$, Cardiología 600 R$, Nutrición 220 R$. Revisión en 30 días incluida.', 'Consultations dès 150 R$ (médecine générale). Dentisterie 180 R$, Dermatologie 350 R$, Cardiologie 600 R$, Nutrition 220 R$. Suivi à 30 jours inclus.'],
  'Qual o horário de funcionamento?': ['Qual o horário de funcionamento?', 'What are the opening hours?', '¿Cuál es el horario de atención?', 'Quelles sont les heures d’ouverture ?'],
  'Segunda a sexta 07h00 às 16h30; sábado 08h00 às 13h00; domingo fechado. A Sophia responde 24h.': ['Segunda a sexta 07h00 às 16h30; sábado 08h00 às 13h00; domingo fechado. A Sophia responde 24h.', 'Mon–Fri 7:00–16:30; Sat 8:00–13:00; closed Sunday. Sophia replies 24/7.', 'Lun–vie 07:00–16:30; sáb 08:00–13:00; domingo cerrado. Sophia responde 24h.', 'Lun–ven 7h00–16h30 ; sam 8h00–13h00 ; fermé dimanche. Sophia répond 24h/24.'],
  'Onde fica a clínica?': ['Onde fica a clínica?', 'Where is the clinic?', '¿Dónde está la clínica?', 'Où se trouve la clinique ?'],
  'Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE. Estacionamento gratuito e acesso adaptado.': ['Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE. Estacionamento gratuito e acesso adaptado.', 'Av. Beira Mar, 1500 — Block B, Room 402, Aracaju/SE. Free parking and adapted access.', 'Av. Beira Mar, 1500 — Bloque B, Sala 402, Aracaju/SE. Estacionamiento gratuito y acceso adaptado.', 'Av. Beira Mar, 1500 — Bloc B, Salle 402, Aracaju/SE. Parking gratuit et accès adapté.'],
  'Quais convênios são aceitos?': ['Quais convênios são aceitos?', 'Which insurances are accepted?', '¿Qué seguros aceptan?', 'Quelles assurances sont acceptées ?'],
  'Unimed, Bradesco Saúde, Amil e SulAmérica para consultas. Pacotes e procedimentos estéticos: somente particular. Casos fora da lista → humano.': ['Unimed, Bradesco Saúde, Amil e SulAmérica para consultas. Pacotes e procedimentos estéticos: somente particular. Casos fora da lista → humano.', 'Unimed, Bradesco Saúde, Amil and SulAmérica for visits. Packages and aesthetic procedures: private only. Cases outside the list → human.', 'Unimed, Bradesco Saúde, Amil y SulAmérica para consultas. Paquetes y estética: solo particular. Fuera de la lista → humano.', 'Unimed, Bradesco Saúde, Amil et SulAmérica pour les consultations. Forfaits et esthétique : privé uniquement. Hors liste → humain.'],
  'Como remarcar ou cancelar?': ['Como remarcar ou cancelar?', 'How to reschedule or cancel?', '¿Cómo reprogramar o cancelar?', 'Comment reporter ou annuler ?'],
  'Remarcação/cancelamento gratuitos até 4h antes. A Sophia oferece 2 novas opções de horário e atualiza a agenda.': ['Remarcação/cancelamento gratuitos até 4h antes. A Sophia oferece 2 novas opções de horário e atualiza a agenda.', 'Free reschedule/cancel up to 4h before. Sophia offers 2 new slots and updates the calendar.', 'Reprogramar/cancelar gratis hasta 4h antes. Sophia ofrece 2 nuevos horarios y actualiza la agenda.', 'Report/annulation gratuits jusqu’à 4h avant. Sophia propose 2 nouveaux créneaux et met à jour l’agenda.'],
  'Quais especialidades atendem?': ['Quais especialidades atendem?', 'Which specialties do you offer?', '¿Qué especialidades atienden?', 'Quelles spécialités proposez-vous ?'],
  'É uma emergência, o que eu faço?': ['É uma emergência, o que eu faço?', 'It\'s an emergency, what do I do?', 'Es una emergencia, ¿qué hago?', 'C’est une urgence, que faire ?'],
  'Emergências não são atendidas por aqui. Ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. Posso agendar uma consulta de rotina depois que você estiver seguro.': ['Emergências não são atendidas por aqui. Ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. Posso agendar uma consulta de rotina depois que você estiver seguro.', 'We don\'t handle emergencies here. Call 192 (SAMU) or go to the nearest emergency room. I can book a routine visit once you\'re safe.', 'Aquí no atendemos emergencias. Llama al 192 (SAMU) o ve a urgencias. Puedo agendar una consulta de rutina cuando estés a salvo.', 'Nous ne gérons pas les urgences ici. Appelez le 192 (SAMU) ou allez aux urgences. Je peux réserver une consultation de routine une fois en sécurité.'],
  'Preciso de preparo para os exames?': ['Preciso de preparo para os exames?', 'Do I need to prepare for the tests?', '¿Necesito preparación para los exámenes?', 'Dois-je me préparer pour les examens ?'],
  'Depende do exame. Após agendar, enviamos as instruções de preparo por WhatsApp (jejum, suspender medicações, etc.). Em caso de dúvida, nossa equipe confirma antes do procedimento.': ['Depende do exame. Após agendar, enviamos as instruções de preparo por WhatsApp (jejum, suspender medicações, etc.). Em caso de dúvida, nossa equipe confirma antes do procedimento.', 'It depends on the test. After booking, we send preparation instructions via WhatsApp (fasting, pausing medication, etc.). If in doubt, our team confirms before the procedure.', 'Depende del examen. Tras agendar, enviamos las instrucciones por WhatsApp (ayuno, suspender medicación, etc.). En caso de duda, nuestro equipo confirma antes.', 'Cela dépend de l’examen. Après réservation, nous envoyons les consignes par WhatsApp (jeûne, arrêt de médicaments, etc.). En cas de doute, notre équipe confirme avant.'],
  'Quais as formas de pagamento e parcelamento?': ['Quais as formas de pagamento e parcelamento?', 'What payment methods and installments are available?', '¿Qué formas de pago y plazos hay?', 'Quels moyens de paiement et échelonnements ?'],
  'Pix, cartão de crédito/débito e link de pagamento. Consultas podem ser parceladas em até 3x sem juros no cartão. Pacotes têm condições especiais com um atendente.': ['Pix, cartão de crédito/débito e link de pagamento. Consultas podem ser parceladas em até 3x sem juros no cartão. Pacotes têm condições especiais com um atendente.', 'Pix, credit/debit card and payment link. Visits can be split into up to 3 interest-free card installments. Packages have special terms with an agent.', 'Pix, tarjeta de crédito/débito y enlace de pago. Consultas en hasta 3 cuotas sin interés. Paquetes con condiciones especiales con un agente.', 'Pix, carte de crédit/débit et lien de paiement. Consultations en jusqu’à 3 fois sans frais. Forfaits aux conditions spéciales avec un agent.'],
  'Atendem crianças? Menor pode ir sozinho?': ['Atendem crianças? Menor pode ir sozinho?', 'Do you see children? Can a minor come alone?', '¿Atienden niños? ¿Un menor puede ir solo?', 'Recevez-vous les enfants ? Un mineur peut-il venir seul ?'],
  'Sim, temos pediatria e atendimento infantil. Menores de 18 anos devem estar acompanhados do responsável legal, que autoriza o atendimento e o pagamento.': ['Sim, temos pediatria e atendimento infantil. Menores de 18 anos devem estar acompanhados do responsável legal, que autoriza o atendimento e o pagamento.', 'Yes, we have pediatrics and child care. Under-18s must be accompanied by a legal guardian, who authorizes care and payment.', 'Sí, tenemos pediatría y atención infantil. Los menores de 18 deben ir con un responsable legal que autorice la atención y el pago.', 'Oui, nous avons la pédiatrie. Les moins de 18 ans doivent être accompagnés d’un responsable légal qui autorise les soins et le paiement.'],
  'Vocês fazem telemedicina / consulta online?': ['Vocês fazem telemedicina / consulta online?', 'Do you offer telemedicine / online visits?', '¿Hacen telemedicina / consulta online?', 'Proposez-vous la télémédecine / consultation en ligne ?'],
  'Sim para especialidades elegíveis (clínica geral, nutrição, psicologia e psiquiatria). O link da videochamada é enviado 15 min antes. Demais especialidades são presenciais.': ['Sim para especialidades elegíveis (clínica geral, nutrição, psicologia e psiquiatria). O link da videochamada é enviado 15 min antes. Demais especialidades são presenciais.', 'Yes for eligible specialties (general practice, nutrition, psychology, psychiatry). The video link is sent 15 min before. Other specialties are in person.', 'Sí para especialidades elegibles (clínica general, nutrición, psicología, psiquiatría). El enlace se envía 15 min antes. Las demás son presenciales.', 'Oui pour les spécialités éligibles (médecine générale, nutrition, psychologie, psychiatrie). Le lien est envoyé 15 min avant. Les autres sont en présentiel.'],
  'Como recebo resultados de exames?': ['Como recebo resultados de exames?', 'How do I receive test results?', '¿Cómo recibo los resultados?', 'Comment recevoir les résultats ?'],
  'Resultados ficam disponíveis no portal do paciente e também enviamos o PDF por WhatsApp assim que liberados. O prazo varia por exame e é informado no agendamento.': ['Resultados ficam disponíveis no portal do paciente e também enviamos o PDF por WhatsApp assim que liberados. O prazo varia por exame e é informado no agendamento.', 'Results are available on the patient portal and we also send the PDF via WhatsApp once released. Timing varies by test and is given at booking.', 'Los resultados están en el portal del paciente y enviamos el PDF por WhatsApp al liberarse. El plazo varía y se informa al agendar.', 'Les résultats sont sur le portail patient et nous envoyons le PDF par WhatsApp dès publication. Le délai varie et est indiqué à la réservation.'],
  'A clínica é acessível?': ['A clínica é acessível?', 'Is the clinic accessible?', '¿La clínica es accesible?', 'La clinique est-elle accessible ?'],
  'Sim. Temos acesso adaptado para cadeirantes, elevador, banheiro acessível e estacionamento gratuito com vagas preferenciais na Av. Beira Mar, 1500.': ['Sim. Temos acesso adaptado para cadeirantes, elevador, banheiro acessível e estacionamento gratuito com vagas preferenciais na Av. Beira Mar, 1500.', 'Yes. We have wheelchair access, an elevator, accessible restrooms and free parking with priority spaces at Av. Beira Mar, 1500.', 'Sí. Acceso adaptado para sillas de ruedas, ascensor, baño accesible y estacionamiento gratuito con plazas preferentes en Av. Beira Mar, 1500.', 'Oui. Accès PMR, ascenseur, toilettes adaptées et parking gratuit avec places réservées au 1500 Av. Beira Mar.'],
  'Como meus dados são tratados (LGPD)?': ['Como meus dados são tratados (LGPD)?', 'How is my data handled (LGPD)?', '¿Cómo se tratan mis datos (LGPD)?', 'Comment mes données sont-elles traitées (LGPD) ?'],
  'Seus dados são usados apenas para o atendimento, com sigilo e conforme a LGPD. Não compartilhamos com terceiros. Você pode solicitar acesso, correção ou exclusão a qualquer momento.': ['Seus dados são usados apenas para o atendimento, com sigilo e conforme a LGPD. Não compartilhamos com terceiros. Você pode solicitar acesso, correção ou exclusão a qualquer momento.', 'Your data is used only for care, confidentially and per LGPD. We don\'t share it with third parties. You can request access, correction or deletion anytime.', 'Tus datos se usan solo para la atención, con confidencialidad y según la LGPD. No los compartimos. Puedes solicitar acceso, corrección o eliminación.', 'Vos données servent uniquement aux soins, en confidentialité et selon la LGPD. Aucun partage. Vous pouvez demander accès, correction ou suppression à tout moment.'],

  /* Respostas rápidas */
  'Nossas consultas começam em R$ 150 com retorno incluso. 💚 Qual especialidade você procura? Já verifico os horários!': ['Nossas consultas começam em R$ 150 com retorno incluso. 💚 Qual especialidade você procura? Já verifico os horários!', 'Our appointments start at R$150 with follow-up included. 💚 Which specialty are you looking for? I\'ll check the slots!', 'Nuestras consultas empiezan en 150 R$ con revisión incluida. 💚 ¿Qué especialidad buscas? ¡Reviso los horarios!', 'Nos consultations commencent à 150 R$, suivi inclus. 💚 Quelle spécialité cherchez-vous ? Je vérifie les créneaux !'],
  'Atendemos seg–sex 07h–16h30 e sáb 08h–13h. Domingo fechado. Quer que eu veja um horário para você?': ['Atendemos seg–sex 07h–16h30 e sáb 08h–13h. Domingo fechado. Quer que eu veja um horário para você?', 'We\'re open Mon–Fri 7:00–16:30 and Sat 8:00–13:00. Closed Sunday. Shall I find a slot for you?', 'Atendemos lun–vie 07–16:30 y sáb 08–13. Domingo cerrado. ¿Te busco un horario?', 'Ouvert lun–ven 7h–16h30 et sam 8h–13h. Fermé dimanche. Je vous trouve un créneau ?'],
  'Estamos na Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE, com estacionamento gratuito. 📍': ['Estamos na Av. Beira Mar, 1500 — Bloco B, Sala 402, Aracaju/SE, com estacionamento gratuito. 📍', 'We\'re at Av. Beira Mar, 1500 — Block B, Room 402, Aracaju/SE, with free parking. 📍', 'Estamos en Av. Beira Mar, 1500 — Bloque B, Sala 402, Aracaju/SE, con estacionamiento gratuito. 📍', 'Nous sommes au 1500 Av. Beira Mar — Bloc B, Salle 402, Aracaju/SE, parking gratuit. 📍'],
  'Vamos agendar! 😊 Me diga a especialidade e sua preferência de dia/turno que eu verifico a agenda agora.': ['Vamos agendar! 😊 Me diga a especialidade e sua preferência de dia/turno que eu verifico a agenda agora.', 'Let\'s book! 😊 Tell me the specialty and your preferred day/shift and I\'ll check the calendar now.', '¡Agendemos! 😊 Dime la especialidad y tu preferencia de día/turno y reviso la agenda ahora.', 'Réservons ! 😊 Dites-moi la spécialité et votre jour/créneau préféré et je vérifie l’agenda.'],
  'Aceitamos Unimed, Bradesco, Amil e SulAmérica para consultas. Qual é o seu plano? Verifico a cobertura.': ['Aceitamos Unimed, Bradesco, Amil e SulAmérica para consultas. Qual é o seu plano? Verifico a cobertura.', 'We accept Unimed, Bradesco, Amil and SulAmérica for visits. What\'s your plan? I\'ll check coverage.', 'Aceptamos Unimed, Bradesco, Amil y SulAmérica para consultas. ¿Cuál es tu plan? Verifico la cobertura.', 'Nous acceptons Unimed, Bradesco, Amil et SulAmérica. Quelle est votre assurance ? Je vérifie la couverture.'],

  /* Versões / perfil */
  'Novos horários (07h) + regra de escalonamento financeiro': ['Novos horários (07h) + regra de escalonamento financeiro', 'New hours (7 AM) + financial escalation rule', 'Nuevos horarios (07h) + regla de escalado financiero', 'Nouveaux horaires (7h) + règle d’escalade financière'],
  'Tom mais acolhedor + emojis moderados': ['Tom mais acolhedor + emojis moderados', 'Warmer tone + moderate emojis', 'Tono más cálido + emojis moderados', 'Ton plus chaleureux + emojis modérés'],
  'Versão inicial — agendamento e dúvidas': ['Versão inicial — agendamento e dúvidas', 'Initial version — booking and questions', 'Versión inicial — citas y dudas', 'Version initiale — RDV et questions'],
  'Clínica multiespecialidades': ['Clínica multiespecialidades', 'Multi-specialty clinic', 'Clínica multiespecialidades', 'Clinique pluridisciplinaire'],
  'Olá! 👋 Sou a Sophia, assistente virtual da Clínica Vida Plena. Como posso ajudar você hoje?': ['Olá! 👋 Sou a Sophia, assistente virtual da Clínica Vida Plena. Como posso ajudar você hoje?', 'Hello! 👋 I\'m Sophia, virtual assistant at Vida Plena Clinic. How can I help you today?', '¡Hola! 👋 Soy Sophia, asistente virtual de la Clínica Vida Plena. ¿Cómo te ayudo hoy?', 'Bonjour ! 👋 Je suis Sophia, assistante virtuelle de la Clinique Vida Plena. Comment puis-je aider ?']
};

/* Índice reverso PT → entrada */
const REV = new Map();
for (const k in CT) REV.set(CT[k][0], CT[k]);

/* Traduz uma string de conteúdo conhecida; desconhecida → original */
export function loc(text) {
  if (text == null) return '';
  if (typeof text === 'object') return text[getLang()] ?? text.pt ?? '';
  const e = REV.get(String(text));
  return e ? e[IDX[getLang()]] : String(text);
}

/* Traduz uma lista de tags */
export function locList(arr) { return (arr || []).map(loc); }

/* t() que também traduz parâmetros de conteúdo (nomes de tipos, etc.) */
export function tt(key, params) {
  if (!params) return t(key);
  const p = {};
  for (const k in params) p[k] = (typeof params[k] === 'string') ? loc(params[k]) : params[k];
  return t(key, p);
}
