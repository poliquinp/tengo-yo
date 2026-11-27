# Tengo Yo

Jeu style web app de carte revisité du jeu Tengo Duo, mais pour les adultes.

L'objectif de la partie est que les paires ou les équipes trouvent un mot identique à une description donnée sur la carte. Le jeu peu se jouer en équipe de deux ou individuellement.

Ex: Un animal à fourrure.

Chaque participant écrit sa réponse sur sa feuille et lors du dévoilement si une équipe à le même mot. Elle marque un point.

- Équipe 1 | Ours, chien
- Équipe 2 | Loup, loup

L'équipe #2 marquerait alors un point.

Lorsque la manche est terminée, on tire une nouvelle carte.

Dans la version adaptée pour adultes, Tengo Yo, les questions sont plus osées et explicites pour faciliter le plaisir associé à jouer à des jeu de société entre adultes.

## Contexte

Le jeu doit reposer sur une page HTML executable via un téléphone cellulaire.

## Stack

- Doit fonctionner sur une page Web .HTML. Le dossier doit pouvoir être téléverser en ligne et fonctionner client-side only.
- Aucune base de données
- Peut utiliser le JSON pour les questions
- three.js ou gsap pour les animations (en lien avec le skill)

## UI / UX

- Utiliser la charte graphique et polcies du dossier ```/ref```
- En se connectant à l'application, splash-screen avec le logo, l'option pour consulter les règlements ou démarrer une partie. Le type d'équipe n'a pas d'importance. Il y par contre un champ pour modifier le nombre de question qu'on veut avoir par partie. Par défaut 20.
- Lorsque la partie commence, on affiche 5,4,3,2,1 et puis le paquet de carte. La première carte se tourne (3D) et on y voit la question. Le timer de 15 seconde démarre. À 0 seconde, un son joue pour dire que c'est terminé. Un bouton apparait donc pour virer la prochaine carte.
- Planifier un bouton "Skip" si la question est trop dure ou d'un commun accord, les joueurs ne veulent pas y répondre
- En atteignant la fin du nombre de round, on affiche une vue pour dire que la partie est complétée et afficher un bouton pour nouvelle partie.
- Au niveau des questions, planifier le tout dans un json simple.

## SKILL à utiliser

Pour la production du projet, utiliser les différents skills mentionnés ci-dessous.

### Game Design Fun

This skill provides professional-grade feedback on game design prototypes, mechanics, and core loops by prioritizing the concept of 'flow' as the primary driver of fun.

```npx skillfish add tielur/claude-game-studiokit fun-review```

### Web Animation Design

This skill transforms Claude into a specialized UI motion designer, leveraging professional principles from the 'Animations on the Web' curriculum. It provides proactive guidance on CSS and JavaScript animations, ensuring motion feels responsive and intentional rather than 'janky' by enforcing specific easing curves, spring physics, and hardware-accelerated transforms.

```npx skillfish add anukkrit149/anukkrit-skills web-animation-design```

### Game Experience Design

This skill provides a comprehensive framework for diagnosing and improving player engagement by focusing on the underlying experience rather than just the technical feature set.

```npx skillfish add rbergman/dark-matter-marketplace experience-design```

### Game Board Layout & Sizing

This skill provides Claude with expert knowledge regarding a specific 16:9 board game layout system, ensuring precise asset placement and scaling. It enforces the 'PPU=100' golden rule for SVG imports, defines the horizontal and vertical zone coordinates (including UI, Reserve, and Grid zones), and provides C# reference logic for grid-to-world conversions.

```npx skillfish add jwmyers/vui-vux-plugins layout-sizing```

Note : Nous travaillerons sur un layout mobile vertical. Donc utiliser ce skill à titre de référence, sans s'y contraindre.

## Référence

Titre: Tengo Duo

Marque: Savana

Description: Un jeu de société avec des règles simples ou il faut marquer des points en proposant les mêmes réponses que les autres joueurs à un thème donné. Une fois que le thème est annoncé, vous avez 15 secondes pour deviner et anticiper les réponses des autres joueurs. Pour gagner, il va falloir être assez rapide et stratégique pour penser comme les autres joueurs.
