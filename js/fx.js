// Animations (GSAP) et petits éléments décoratifs.
// Règles suivies : uniquement transform/opacity, ease-out pour entrer/sortir,
// ease-in-out pour ce qui bouge à l'écran, respect de prefers-reduced-motion.
const { gsap } = window;

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => reduceQuery.matches;

/** Durée réelle : 0 si l'utilisateur a demandé moins d'animations. */
const d = (seconds) => (reducedMotion() ? 0 : seconds);

const PALETTE = ['#FF007F', '#FF9A00', '#00A859', '#0077C8', '#FF0000', '#FFFFFF'];

/* ---------------------------------------------------------------- Écrans */

export function showScreen(next, prev) {
  if (prev && prev !== next) {
    gsap.killTweensOf(prev);
    prev.hidden = true;
    prev.classList.remove('is-active');
  }
  next.hidden = false;
  next.classList.add('is-active');
  return gsap.fromTo(next, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: d(0.28), ease: 'power3.out', clearProps: 'transform' });
}

export function popIn(el, delay = 0) {
  el.hidden = false;
  return gsap.fromTo(el, { opacity: 0, y: 12, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: d(0.25), delay: d(delay), ease: 'power3.out' });
}

/* ------------------------------------------------------ Compte à rebours */

export function playCountdown(el, from, onNumber) {
  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });
    for (let n = from; n >= 1; n--) {
      tl.call(() => {
        el.textContent = n;
        el.style.color = PALETTE[(from - n) % 4];
        onNumber?.(n);
      });
      tl.fromTo(el, { scale: 1.8, opacity: 0, rotation: n % 2 ? -8 : 8 }, { scale: 1, opacity: 1, rotation: 0, duration: d(0.35), ease: 'back.out(2)' });
      tl.to(el, { scale: 0.7, opacity: 0, duration: d(0.2), ease: 'power2.out' }, `+=${reducedMotion() ? 0.8 : 0.45}`);
    }
  });
}

/* ---------------------------------------------------------------- Cartes */

/** Pile décorative de dos de carte, épaisseur selon les cartes restantes. */
export function renderStack(deckEl, remaining) {
  const layers = Math.max(0, Math.min(4, remaining));
  if (deckEl.childElementCount === layers) return;
  deckEl.replaceChildren();
  for (let i = 0; i < layers; i++) {
    const c = document.createElement('div');
    c.className = 'stack-card';
    const depth = layers - i; // le plus bas en premier
    c.style.transform = `translate(${depth * 1.5}px, ${depth * 3}px) rotate(${(depth % 2 ? -1 : 1) * depth * 0.6}deg)`;
    deckEl.appendChild(c);
  }
}

export function createCard(question, pepper) {
  const card = document.createElement('div');
  card.className = 'card';
  // Deux moitiés : la question à l'envers en haut, à l'endroit en bas,
  // pour que toute la table puisse lire. Les piments au centre.
  card.innerHTML = `
    <div class="card__inner">
      <div class="card__face card__face--back"></div>
      <div class="card__face card__face--front">
        <div class="card__half card__half--top" aria-hidden="true"><p class="card__text"></p></div>
        <div class="card__divider">
          <span class="card__spice" aria-label="Intensité ${question.spice}">${pepper(question.spice)}</span>
        </div>
        <div class="card__half card__half--bottom"><p class="card__text"></p></div>
      </div>
    </div>`;
  card.querySelectorAll('.card__text').forEach((p) => { p.textContent = question.text; });
  return card;
}

/** Taille de texte la plus grande qui tient dans une moitié, appliquée aux deux. */
export function fitCardText(card) {
  const texts = card.querySelectorAll('.card__text');
  const half = card.querySelector('.card__half--bottom');
  const ref = half.querySelector('.card__text');
  const w = half.clientWidth;
  const maxH = half.clientHeight;
  let size = Math.min(w * 0.1, maxH * 0.22); // taille max ; réduite si la question est longue
  const min = w * 0.055;
  const apply = () => texts.forEach((t) => { t.style.fontSize = `${size}px`; });
  apply();
  // Hauteur de la moitié respectée, et aucun mot ne déborde sur la largeur.
  while ((ref.scrollHeight > maxH || ref.scrollWidth > ref.clientWidth + 1) && size > min) {
    size -= 1;
    apply();
  }
}

/** Sort la carte de la pile puis la retourne en 3D. */
export function dealAndFlip(card, onFlipStart) {
  const inner = card.querySelector('.card__inner');
  return new Promise((resolve) => {
    if (reducedMotion()) {
      gsap.set(inner, { rotationY: 180 });
      onFlipStart?.();
      resolve();
      return;
    }
    gsap.timeline({ onComplete: resolve })
      .fromTo(card, { y: 0, scale: 1 }, { y: -14, scale: 1.04, duration: 0.22, ease: 'power2.out' })
      .call(() => onFlipStart?.())
      .to(inner, { rotationY: 180, duration: 0.7, ease: 'power3.inOut' }, '<0.05')
      .to(card, { y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }, '-=0.25');
  });
}

/** Carte suivante : la carte jouée part sur la gauche. */
export function discardCard(card) {
  card.style.zIndex = '5'; // reste au-dessus de la carte suivante pendant qu'elle s'envole
  return new Promise((resolve) => {
    gsap.to(card, {
      x: () => -window.innerWidth * 1.1,
      y: 30,
      rotation: -24,
      duration: d(0.38),
      ease: 'power3.out',
      onComplete: () => { card.remove(); resolve(); },
    });
  });
}

/** Carte passée : tampon « PASSÉE » puis elle tombe. */
export function skipCard(card) {
  const stamp = document.createElement('div');
  stamp.className = 'card__stamp';
  stamp.textContent = 'Passée';
  card.querySelector('.card__face--front').appendChild(stamp);
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { card.remove(); resolve(); } })
      .fromTo(stamp, { scale: 2.2, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: -12, duration: d(0.22), ease: 'back.out(2.2)' })
      .to(card, { y: () => window.innerHeight * 0.8, rotation: 10, opacity: 0, duration: d(0.4), ease: 'power3.out' }, `+=${d(0.35)}`);
  });
}

export function shakeCard(card) {
  if (reducedMotion()) return;
  gsap.fromTo(card, { x: 0 }, {
    keyframes: { x: [0, -10, 9, -7, 5, -3, 0] },
    duration: 0.45,
    ease: 'none',
  });
}

export function pulse(el, scale = 1.22) {
  if (reducedMotion()) return;
  gsap.fromTo(el, { scale }, { scale: 1, duration: 0.3, ease: 'power3.out' });
}

/* -------------------------------------------------------------- Confettis */

export function confettiBurst(container, count = 70) {
  if (reducedMotion()) return;
  const { innerWidth: W, innerHeight: H } = window;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'confetti__piece';
    p.style.background = PALETTE[i % PALETTE.length];
    if (i % 3 === 0) p.style.borderRadius = '50%';
    container.appendChild(p);
    const x0 = W / 2 + gsap.utils.random(-40, 40);
    const y0 = H * 0.42;
    gsap.set(p, { x: x0, y: y0, rotation: gsap.utils.random(0, 360) });
    gsap.timeline({ onComplete: () => p.remove() })
      .to(p, {
        x: x0 + gsap.utils.random(-W * 0.6, W * 0.6),
        y: y0 - gsap.utils.random(H * 0.15, H * 0.45),
        rotation: `+=${gsap.utils.random(-360, 360)}`,
        duration: gsap.utils.random(0.5, 0.8),
        ease: 'power3.out',
      })
      .to(p, {
        y: H + 40,
        rotation: `+=${gsap.utils.random(-540, 540)}`,
        duration: gsap.utils.random(1.4, 2.4),
        ease: 'sine.in',
      })
      .to(p, { opacity: 0, duration: 0.3 }, '-=0.3');
  }
}
