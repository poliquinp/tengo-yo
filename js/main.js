import { CONFIG, pepperString } from './config.js';
import { load, save } from './storage.js';
import { Deck, loadQuestions, countBySpice } from './deck.js';
import { Timer } from './timer.js';
import { sound, vibrate, wakeLock } from './audio.js';
import * as fx from './fx.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const screens = {
  home: $('#screen-home'),
  rules: $('#screen-rules'),
  countdown: $('#screen-countdown'),
  game: $('#screen-game'),
  end: $('#screen-end'),
};

const el = {
  countValue: $('#count-value'),
  spicePicker: $('#spice-picker'),
  hint: $('#settings-hint'),
  play: $('#btn-play'),
  countdown: $('#countdown-number'),
  table: $('#table'),
  deck: $('#deck'),
  srQuestion: $('#sr-question'),
  endStats: $('#end-stats'),
  confetti: $('#confetti'),
  quitDialog: $('#dialog-quit'),
};

/* Barre de contrôle dupliquée : une en bas, une copie tournée à 180° en haut
   pour les joueurs en face. Les deux restent synchronisées. */
(function mirrorControls() {
  const bottom = $('#controls');
  const top = bottom.cloneNode(true);
  top.removeAttribute('id');
  top.classList.replace('controls--bottom', 'controls--top');
  top.setAttribute('aria-hidden', 'true'); // doublon visuel : les lecteurs d'écran lisent celle du bas
  top.querySelector('[role="timer"]')?.removeAttribute('role');
  top.querySelectorAll('button').forEach((b) => b.setAttribute('tabindex', '-1'));
  screens.game.insertBefore(top, el.table);
})();

const hud = {
  round: $$('[data-hud="round"]'),
  total: $$('[data-hud="total"]'),
  timer: $$('[data-hud="timer"]'),
  value: $$('[data-hud="value"]'),
  progress: $$('[data-hud="progress"]'),
  skip: $$('[data-action="skip"]'),
  next: $$('[data-action="next"]'),
  roundBox: $$('.controls__round'),
};

const setText = (list, text) => list.forEach((n) => { n.textContent = text; });
const setHidden = (list, hidden) => list.forEach((n) => { n.hidden = hidden; });

/* ------------------------------------------------------------------ État */

const saved = load(CONFIG.storageKeys.settings, {});
const settings = {
  count: Number.isInteger(saved.count) ? saved.count : CONFIG.count.default,
  // Intensité maximale : 3 = cartes de niveau 1 à 3.
  spiceMax: CONFIG.spice.levels.includes(saved.spiceMax)
    ? saved.spiceMax
    : Array.isArray(saved.spices) && saved.spices.length // ancien format (sélection multiple)
      ? Math.max(...saved.spices)
      : CONFIG.spice.default,
  mode: saved.mode in CONFIG.modes.labels ? saved.mode : CONFIG.modes.default,
  muted: saved.muted === true,
};

/** Niveaux joués : de 1 jusqu'au maximum choisi. */
const activeSpices = () => CONFIG.spice.levels.filter((l) => l <= settings.spiceMax);

const state = {
  screen: 'home',
  questions: [],
  spiceCounts: {},
  deck: null,
  card: null,     // élément DOM de la carte active
  phase: 'idle',  // idle | countdown | dealing | timing | timeup | leaving | ended
};

const timer = new Timer({
  seconds: CONFIG.roundSeconds,
  onFrame: (remaining, progress) => {
    const offset = String(-progress * 100);
    hud.progress.forEach((p) => { p.style.strokeDashoffset = offset; });
  },
  onSecond: (sec) => {
    setText(hud.value, sec);
    const warn = sec <= CONFIG.warningSeconds && sec > 0;
    hud.timer.forEach((t) => t.classList.toggle('is-warning', warn));
    if (warn) {
      sound.beep({ freq: 1320, duration: 0.05, volume: 0.18 });
      vibrate(25);
      hud.value.forEach((v) => fx.pulse(v));
    }
  },
  onEnd: onTimeUp,
});

/* --------------------------------------------------------------- Écrans */

function go(name) {
  const prev = screens[state.screen];
  state.screen = name;
  fx.showScreen(screens[name], prev);
  // Musique d'ambiance seulement sur l'accueil et les règlements
  sound.setMusic(name === 'home' || name === 'rules');
  if (name === 'end') fx.popIn($('#end-logo'), 0.05);
}

/* ---------------------------------------------------------- Réglages */

function availableCount() {
  return activeSpices().reduce((n, s) => n + (state.spiceCounts[s] ?? 0), 0);
}

function maxCount() {
  return Math.min(CONFIG.count.max, Math.max(1, availableCount()));
}

function renderSettings() {
  const max = maxCount();
  const clamped = Math.max(Math.min(settings.count, max), Math.min(CONFIG.count.min, max));
  el.countValue.textContent = clamped;
  $$('.stepper__btn').forEach((b) => {
    const step = Number(b.dataset.step);
    b.disabled = step < 0 ? clamped <= Math.min(CONFIG.count.min, max) : clamped >= max;
  });

  $$('.spice-chip').forEach((chip) => {
    const lvl = Number(chip.dataset.level);
    chip.classList.toggle('is-in-range', lvl <= settings.spiceMax);
    chip.querySelector('input').checked = lvl === settings.spiceMax;
  });

  $$('#mode-picker input').forEach((input) => { input.checked = input.value === settings.mode; });

  if (!state.questions.length) return;
  const available = availableCount();
  const label = CONFIG.spice.labels[settings.spiceMax];
  const range = settings.spiceMax === 1 ? `« ${label} » seulement` : `Jusqu'à « ${label} »`;
  el.hint.classList.remove('is-error');
  el.hint.textContent =
    settings.count > max
      ? `${range} : seulement ${available} cartes.`
      : `${range} : ${available} cartes disponibles`;
  el.play.disabled = available === 0;
}

function effectiveCount() {
  const max = maxCount();
  return Math.max(Math.min(settings.count, max), Math.min(CONFIG.count.min, max));
}

function persistSettings() {
  save(CONFIG.storageKeys.settings, settings);
}

function buildSpicePicker() {
  const frag = document.createDocumentFragment();
  for (const lvl of CONFIG.spice.levels) {
    // Radio natif : un seul choix, navigation au clavier incluse.
    const label = document.createElement('label');
    label.className = 'spice-chip';
    label.dataset.level = lvl;
    label.innerHTML = `
      <input class="sr-only" type="radio" name="spice-max" value="${lvl}">
      <span class="sr-only">Jusqu'à ${lvl} piment${lvl > 1 ? 's' : ''} : ${CONFIG.spice.labels[lvl]}</span>
      <span class="spice-chip__num" aria-hidden="true">${lvl}</span>
      <span class="spice-chip__pepper" aria-hidden="true">🌶️</span>`;
    frag.appendChild(label);
  }
  el.spicePicker.replaceChildren(frag);

  const legend = $('#rules-spice');
  legend.replaceChildren(
    ...CONFIG.spice.levels.map((lvl) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="rules__peppers">${pepperString(lvl)}</span><span>${CONFIG.spice.labels[lvl]}</span>`;
      return li;
    }),
  );
}

function bindSettings() {
  $$('.stepper__btn').forEach((b) =>
    b.addEventListener('click', () => {
      const step = Number(b.dataset.step);
      const max = maxCount();
      settings.count = Math.max(CONFIG.count.min, Math.min(max, effectiveCount() + step));
      persistSettings();
      renderSettings();
      fx.pulse(el.countValue, 1.15);
    }),
  );

  el.spicePicker.addEventListener('change', (e) => {
    const lvl = Number(e.target.value);
    if (!CONFIG.spice.levels.includes(lvl)) return;
    settings.spiceMax = lvl;
    persistSettings();
    renderSettings();
    fx.pulse(e.target.closest('.spice-chip'), 1.12);
  });

  $('#mode-picker').addEventListener('change', (e) => {
    if (!(e.target.value in CONFIG.modes.labels)) return;
    settings.mode = e.target.value;
    persistSettings();
    renderSettings();
  });
}

/* ------------------------------------------------------------- Son */

function renderSoundButtons() {
  $$('[data-action="toggle-sound"]').forEach((b) => {
    b.setAttribute('aria-pressed', String(!settings.muted));
    b.setAttribute('aria-label', settings.muted ? 'Son coupé' : 'Son activé');
  });
}

function toggleSound() {
  settings.muted = !settings.muted;
  sound.unlock();
  sound.setMuted(settings.muted);
  persistSettings();
  renderSoundButtons();
}

/* ---------------------------------------------------------- Partie */

async function startGame() {
  if (!state.questions.length) return;
  sound.unlock();
  sound.setMuted(settings.muted);
  wakeLock.request();
  if (!history.state?.tengo) history.pushState({ tengo: 1 }, '');

  state.deck = new Deck(state.questions, { count: effectiveCount(), spices: activeSpices(), mode: settings.mode });
  setText(hud.total, state.deck.total);
  setText(hud.round, 0);
  el.deck.replaceChildren();
  state.card?.remove();
  state.card = null;
  resetTimerUi();
  setHidden(hud.next, true);
  setHidden(hud.skip, true);

  state.phase = 'countdown';
  go('countdown');
  await fx.playCountdown(el.countdown, CONFIG.countdownFrom, (n) => {
    sound.beep({ freq: n === 1 ? 990 : 660, duration: 0.12, volume: 0.22, type: 'triangle' });
    vibrate(15);
  });
  if (state.phase !== 'countdown') return; // quitté pendant le décompte

  go('game');
  fx.renderStack(el.deck, state.deck.total);
  await dealNext();
}

async function dealNext() {
  const q = state.deck.next();
  if (!q) return endGame();
  setText(hud.round, state.deck.round);
  hud.roundBox.forEach((b) => fx.pulse(b, 1.12));
  await showCard(q);
}

async function showCard(q) {
  state.phase = 'dealing';
  setHidden(hud.next, true);
  setHidden(hud.skip, true);
  resetTimerUi();

  const card = fx.createCard(q, pepperString);
  el.table.appendChild(card);
  state.card = card;
  fx.renderStack(el.deck, state.deck.total - state.deck.round);
  fx.fitCardText(card);

  await fx.dealAndFlip(card, () => sound.whoosh());
  if (state.card !== card || state.phase !== 'dealing') return;

  el.srQuestion.textContent = `Carte ${state.deck.round} : ${q.text}`;
  state.phase = 'timing';
  hud.skip.forEach((b) => fx.popIn(b));
  timer.start();
}

function resetTimerUi() {
  timer.stop();
  hud.timer.forEach((t) => t.classList.remove('is-warning', 'is-done'));
  setText(hud.value, CONFIG.roundSeconds);
  hud.progress.forEach((p) => { p.style.strokeDashoffset = '0'; });
}

function onTimeUp() {
  if (state.phase !== 'timing') return;
  state.phase = 'timeup';
  hud.timer.forEach((t) => {
    t.classList.remove('is-warning');
    t.classList.add('is-done');
    fx.pulse(t, 1.15);
  });
  setText(hud.value, '0');
  sound.play('buzzer');
  vibrate([180, 80, 180]);
  fx.shakeCard(state.card);

  setHidden(hud.skip, true);
  setText(hud.next, state.deck.isLast ? 'Terminer' : 'Carte suivante');
  hud.next.forEach((b) => fx.popIn(b, 0.15));
  setTimeout(() => { if (state.phase === 'timeup') hud.next.at(-1).focus({ preventScroll: true }); }, 200);
}

async function onNext() {
  if (state.phase !== 'timeup') return;
  state.phase = 'leaving';
  setHidden(hud.next, true);
  const card = state.card;
  state.card = null;
  sound.whoosh({ duration: 0.2, volume: 0.12 });
  if (state.deck.isLast) {
    await fx.discardCard(card);
    return endGame();
  }
  fx.discardCard(card); // la carte suivante se retourne pendant que l'autre s'envole
  await dealNext();
}

async function onSkip() {
  if (state.phase !== 'timing') return;
  state.phase = 'leaving';
  timer.stop();
  setHidden(hud.skip, true);
  const card = state.card;
  state.card = null;
  const replacement = state.deck.skip();
  await fx.skipCard(card);
  if (replacement) return showCard(replacement);
  // Réserve vide : la carte compte comme jouée.
  if (state.deck.isLast) return endGame();
  return dealNext();
}

function endGame() {
  state.phase = 'ended';
  timer.stop();
  state.deck.commitHistory();
  wakeLock.release();
  state.card?.remove();
  state.card = null;

  const played = state.deck.total;
  const skipped = state.deck.skipped;
  el.endStats.textContent =
    `${played} carte${played > 1 ? 's' : ''} jouée${played > 1 ? 's' : ''}` +
    (skipped ? `, ${skipped} passée${skipped > 1 ? 's' : ''}` : '');

  go('end');
  sound.play('buzzer', 0.4);
  setTimeout(() => fx.confettiBurst(el.confetti), 150);
}

function quitGame() {
  timer.stop();
  if (state.deck && state.phase !== 'ended') state.deck.commitHistory();
  state.phase = 'idle';
  state.card?.remove();
  state.card = null;
  wakeLock.release();
  go('home');
}

function askQuit() {
  if (state.phase === 'idle' || state.phase === 'ended') return;
  if (state.phase === 'timing') timer.pause();
  if (!el.quitDialog.open) el.quitDialog.showModal();
}

/* ------------------------------------------------------- Événements */

function bindActions() {
  el.play.addEventListener('click', startGame);
  $('#btn-rules').addEventListener('click', () => go('rules'));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'next': return onNext();
      case 'skip': return onSkip();
      case 'toggle-sound': return toggleSound();
      case 'close-rules': return go('home');
      case 'quit': return askQuit();
      case 'quit-cancel':
        el.quitDialog.close();
        return;
      case 'quit-confirm':
        el.quitDialog.close('quit');
        return quitGame();
      case 'replay': return startGame();
      case 'home': return go('home');
    }
  });

  // Fermer la boîte de dialogue (Échap, retour) = continuer la partie.
  el.quitDialog.addEventListener('close', () => {
    if (el.quitDialog.returnValue !== 'quit' && state.phase === 'timing') timer.resume();
    el.quitDialog.returnValue = '';
  });

  // Bouton « retour » Android : demander avant de quitter la partie.
  window.addEventListener('popstate', () => {
    if (['countdown', 'dealing', 'timing', 'timeup', 'leaving'].includes(state.phase)) {
      history.pushState({ tengo: 1 }, '');
      askQuit();
    } else if (state.screen === 'rules' || state.screen === 'end') {
      go('home');
    }
  });

  // Pause du chrono quand l'app passe en arrière-plan.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.phase === 'timing') timer.pause();
      sound.suspend(); // pas de musique quand le cell est en veille ou sur une autre app
    } else {
      sound.resume();
      if (state.phase === 'timing' && !el.quitDialog.open) timer.resume();
      if (wakeLock.wanted) wakeLock.request();
    }
  });

  // Recalibrer le texte de la carte si l'écran tourne.
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => state.card && fx.fitCardText(state.card));
  });
}

/* ------------------------------------------------------------ Démarrage */

async function init() {
  buildSpicePicker();
  bindSettings();
  bindActions();
  renderSoundButtons();
  renderSettings();
  go('home');

  // Les navigateurs bloquent le son avant un premier geste : la musique
  // de l'accueil démarre au premier toucher, n'importe où sur l'écran.
  const firstGesture = () => {
    sound.setMuted(settings.muted);
    sound.unlock();
    window.removeEventListener('pointerdown', firstGesture, true);
    window.removeEventListener('keydown', firstGesture, true);
  };
  window.addEventListener('pointerdown', firstGesture, true);
  window.addEventListener('keydown', firstGesture, true);

  el.play.disabled = true;
  try {
    state.questions = await loadQuestions();
    state.spiceCounts = countBySpice(state.questions);
    renderSettings();
  } catch (err) {
    console.error(err);
    el.hint.classList.add('is-error');
    el.hint.textContent =
      location.protocol === 'file:'
        ? 'Ouvre le jeu via un serveur web (voir README).'
        : 'Impossible de charger les cartes. Recharge la page.';
  }

  // Précharger les deux faces de carte pour un premier retournement net.
  new Image().src = 'assets/img/card-back.webp';
  new Image().src = 'assets/img/card-front.webp';
}

init();
