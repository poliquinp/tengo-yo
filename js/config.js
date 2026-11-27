// Réglages centraux du jeu. Modifier ici plutôt que dans le code.
export const CONFIG = {
  questionsUrl: 'data/questions.json',
  buzzerUrl: 'assets/sounds/buzzer.mp3',

  roundSeconds: 15,       // durée du chrono par carte
  warningSeconds: 5,      // dernières secondes : anneau rouge + tic
  countdownFrom: 5,       // 5, 4, 3, 2, 1 avant la première carte

  count: { default: 20, min: 5, max: 100, step: 5 },

  spice: {
    levels: [1, 2, 3],
    default: 3, // intensité maximale par défaut
    labels: {
      1: 'Loufoque',
      2: 'Irrévérencieux',
      3: 'Coquin',
    },
  },

  // Modes de jeu : « escalade » (1 → 3 piments au fil de la partie) ou « aleatoire ».
  modes: {
    default: 'escalade',
    labels: { escalade: 'Escalade', aleatoire: 'Aléatoire' },
  },

  // Force de la montée en mode escalade : plus c'est haut, plus la progression est stricte.
  escalation: 1.6,

  // Fraction du paquet jouable qu'on évite de revoir à la partie suivante.
  historyRatio: 0.6,

  storageKeys: {
    settings: 'tengoyo.settings.v1',
    history: 'tengoyo.history.v1',
  },
};

export const PEPPER = '🌶️';
export const pepperString = (n) => PEPPER.repeat(n);
