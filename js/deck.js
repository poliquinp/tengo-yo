import { CONFIG } from './config.js';
import { load, save } from './storage.js';

/** Charge et valide la banque de questions. */
export async function loadQuestions(url = CONFIG.questionsUrl) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Impossible de charger les questions (${res.status})`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(list)) throw new Error('Format de questions invalide');

  const seen = new Set();
  return list.filter((q) => {
    const ok =
      q && typeof q.id === 'string' && !seen.has(q.id) &&
      typeof q.text === 'string' && q.text.trim() &&
      CONFIG.spice.levels.includes(q.spice);
    if (ok) seen.add(q.id);
    else console.warn('[Tengo Yo] Question ignorée :', q);
    return ok;
  });
}

export function countBySpice(questions) {
  const counts = Object.fromEntries(CONFIG.spice.levels.map((l) => [l, 0]));
  for (const q of questions) counts[q.spice]++;
  return counts;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Un paquet pour une partie : `count` cartes ordonnées en montée d'intensité,
 * plus une réserve pour remplacer les cartes passées.
 */
export class Deck {
  constructor(questions, { count, spices, mode = 'escalade' }) {
    this.mode = mode;
    const allowed = new Set(spices);
    const pool = questions.filter((q) => allowed.has(q.spice));
    const history = load(CONFIG.storageKeys.history, []);
    const age = new Map(history.map((id, i) => [id, i])); // petit index = vu il y a longtemps

    const fresh = shuffle(pool.filter((q) => !age.has(q.id)));
    const stale = pool.filter((q) => age.has(q.id)).sort((a, b) => age.get(a.id) - age.get(b.id));
    const ordered = fresh.concat(stale);

    const chosen = ordered.slice(0, count);
    this.reserve = ordered.slice(count);
    // Escalade : de 1 à 3 piments au fil de la partie. Aléatoire : tout mélangé.
    this.cards = mode === 'aleatoire' ? shuffle(chosen) : escalate(chosen);
    this.total = this.cards.length;
    this.index = -1;
    this.played = [];
    this.skipped = 0;
    this.totalQuestions = questions.length;
  }

  get current() {
    return this.cards[this.index] ?? null;
  }

  get round() {
    return this.index + 1;
  }

  get isLast() {
    return this.index >= this.total - 1;
  }

  next() {
    if (this.current) this.played.push(this.current.id);
    this.index++;
    return this.current;
  }

  /** Remplace la carte courante : intensité proche en escalade, au hasard en aléatoire. */
  skip() {
    const skippedCard = this.current;
    if (!skippedCard) return null;
    this.played.push(skippedCard.id);
    this.skipped++;
    if (!this.reserve.length) return null;

    if (this.mode === 'aleatoire') {
      const [replacement] = this.reserve.splice(0, 1); // la réserve commence par les cartes jamais vues, mélangées
      this.cards[this.index] = replacement;
      return replacement;
    }

    let best = 0;
    let bestDist = Infinity;
    this.reserve.forEach((q, i) => {
      const d = Math.abs(q.spice - skippedCard.spice);
      if (d < bestDist) { best = i; bestDist = d; }
    });
    const [replacement] = this.reserve.splice(best, 1);
    this.cards[this.index] = replacement;
    return replacement;
  }

  /** Mémorise les cartes vues pour limiter les répétitions entre parties. */
  commitHistory() {
    if (this.current && this.played.at(-1) !== this.current.id) this.played.push(this.current.id);
    const played = [...new Set(this.played)];
    const cap = Math.max(10, Math.floor(this.totalQuestions * CONFIG.historyRatio));
    const prev = load(CONFIG.storageKeys.history, []).filter((id) => !played.includes(id));
    save(CONFIG.storageKeys.history, prev.concat(played).slice(-cap));
  }
}

/** Trie par intensité avec du bruit : ça monte, sans être prévisible. */
function escalate(cards) {
  const k = CONFIG.escalation;
  const span = Math.max(1, CONFIG.spice.levels.length - 1);
  return cards
    .map((q) => ({ q, key: ((q.spice - 1) / span) * k + Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.q);
}
