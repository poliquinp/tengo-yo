# Changelog

Toutes les modifications notables de Tengo Yo sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et la numérotation suit [Semantic Versioning](https://semver.org/lang/fr/) :

- **Majeure** (2.0.0) : changement des règles ou refonte du jeu.
- **Mineure** (1.1.0) : nouvelles cartes, nouvelle catégorie, nouveau mode ou nouvelle fonctionnalité.
- **Correctif** (1.0.3) : corrections de cartes, de bogues, de textes ou de mise en page.

## [Non publié]

## [1.1.0] - 2026-11-27

### Cartes

- Nouvelle catégorie `devinette` : 12 devinettes (10 🌶️, 1 🌶️🌶️, 1 🌶️🌶️🌶️). La plupart ont plusieurs réponses plausibles : il faut deviner laquelle son coéquipier va choisir.
- Total : 431 cartes (279 🌶️, 100 🌶️🌶️, 52 🌶️🌶️🌶️).

## [1.0.2] - 2026-11-27

Première version consignée dans ce changelog. Elle regroupe tout ce qui a été livré jusqu'ici.

### Jeu

- Partie complète sur un seul cell posé à plat : accueil, règlements, décompte 5-4-3-2-1, carte qui se retourne en 3D, chrono de 15 secondes, buzzer, écran de fin.
- Carte lisible des deux côtés de la table (question à l'endroit et à l'envers, piment au milieu).
- Barre de contrôle (manche, chrono, « Passer » / « Carte suivante ») répétée en haut et en bas.
- Réglages mémorisés sur l'appareil : nombre de cartes (5 à 100, 20 par défaut), piquant maximum, mode de jeu, son.
- Deux modes : *Escalade* (de 🌶️ à 🌶️🌶️🌶️ au fil de la partie) et *Aléatoire*.
- Passer une carte : elle ne compte pas et une carte d'intensité voisine la remplace.
- Historique des cartes vues pour limiter les répétitions d'une partie à l'autre.
- Musique en boucle sur l'accueil et les règlements, bips du décompte, vibration, écran maintenu allumé, pause automatique si l'app passe en arrière-plan.

### Cartes

- 419 cartes en 3 niveaux : 269 🌶️ Loufoque, 99 🌶️🌶️ Irrévérencieux, 51 🌶️🌶️🌶️ Coquin.
- Règle « une réponse = un mot » appliquée à toutes les cartes.
- Ajout de cartes de culture générale (pays, métiers, plats québécois, marques, émissions…).
- Retrait des cartes jugées trop osées (anciens niveaux 4 et 5, catégorie « au lit ») : aucun contenu sexuel explicite.

### Feuilles à imprimer

- Feuille de réponses avec logo et code QR vers le jeu.
- Feuille de pointage à 6 colonnes d'équipes (points en bâtons).
- Versions PDF prêtes à imprimer.

### Partage et SEO

- Balises SEO, Open Graph, X/Twitter et données structurées `WebApplication`.
- Image de partage 1200 x 630, aperçu GitHub 1280 x 640, favicons et icônes d'écran d'accueil.
- Manifeste web et sitemap.
- README GitHub avec bannière, GIF de démo et captures d'écran.

[Non publié]: https://github.com/poliquinp/tengo-yo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/poliquinp/tengo-yo/compare/b70cd37...v1.1.0
[1.0.2]: https://github.com/poliquinp/tengo-yo/commits/b70cd37
