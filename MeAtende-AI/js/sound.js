/* =====================================================================
   MeAtende AI — sound.js
   Alertas sonoros curtos e suaves via Web Audio API (sem arquivos).
   - alert():   IA transferiu para humano (chama atenção, gentil)
   - takeover(): você assumiu a conversa (tom curto grave→agudo)
   - back():    devolveu para a Sophia (tom curto suave)
   ===================================================================== */

let ctx = null;
let enabled = (() => { try { return localStorage.getItem('meatende.sound') !== 'off'; } catch { return true; } })();

function ac() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

/* Toca uma nota suave com envelope (ataque/release) para evitar cliques */
function note(freq, start, dur, gain = 0.08, type = 'sine') {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export function setSoundEnabled(v) { enabled = !!v; try { localStorage.setItem('meatende.sound', enabled ? 'on' : 'off'); } catch {} }
export function isSoundEnabled() { return enabled; }

/* IA → humano: dois tons gentis que chamam atenção */
export function playAlert() {
  if (!enabled) return;
  note(660, 0, 0.18, 0.07);
  note(880, 0.16, 0.22, 0.07);
}

/* Você assumiu: tom curto ascendente suave */
export function playTakeover() {
  if (!enabled) return;
  note(523, 0, 0.12, 0.06);
  note(784, 0.09, 0.14, 0.06);
}

/* Devolveu para a Sophia: tom curto descendente suave */
export function playBack() {
  if (!enabled) return;
  note(784, 0, 0.12, 0.06);
  note(523, 0.09, 0.16, 0.06);
}

/* Desbloqueia o áudio no primeiro gesto do usuário (política de autoplay) */
export function unlockAudio() { ac(); }
