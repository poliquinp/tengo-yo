# Tengo Yo

Party game pour adultes : une carte, un thème, 15 secondes pour écrire le même mot que son coéquipier.
Web app mobile 100 % client-side (HTML, CSS, JS), sans base de données ni étape de build.

## Lancer en local

Les questions sont chargées en JSON : il faut un petit serveur web (ouvrir `index.html` en double-clic ne fonctionne pas).

```bash
python -m http.server 4790
# puis http://localhost:4790
```

Pour tester sur un cellulaire du même réseau Wi-Fi : `python -m http.server 4790 --bind 0.0.0.0`, puis `http://<IP-du-PC>:4790`.

## Déployer

Téléverser le dossier tel quel sur n'importe quel hébergement statique (Netlify, GitHub Pages, serveur Apache/Nginx…).
Le dossier `ref/` (sources graphiques) et `.claude/` ne sont pas nécessaires en ligne.

## Structure

```text
index.html            Écrans : accueil, règlements, décompte, partie, fin
css/styles.css        Charte Día de Muertos, mise en page mobile verticale
js/
  main.js             Contrôleur : écrans, réglages, déroulement d'une partie
  config.js           Réglages : durée du chrono, nb de cartes, intensités, modes de jeu
  deck.js             Chargement des questions, tirage, mode escalade/aléatoire, historique
  timer.js            Chrono 15 s (pause si l'app passe en arrière-plan)
  audio.js            Buzzer, bips, vibration, maintien de l'écran allumé
  fx.js               Animations GSAP : flip 3D, décompte, confettis
data/questions.json   Banque de questions
print/
  reponses.html       Feuille de réponses : logo + code QR vers le jeu
  pointage.html       Feuille de pointage : 6 colonnes d'équipes
  print.css           Styles communs des feuilles (format Lettre)
  qr-tengoyo.png      Code QR → https://patricepoliquin.com/tengoyo/
  tengo-yo-*.pdf      Les deux feuilles, prêtes à imprimer
assets/               Images WebP optimisées, polices, son
vendor/gsap.min.js    GSAP 3 (local, aucun CDN)
```

## Modes de jeu

- **Escalade** (par défaut) : les cartes montent de 🌶️ à 🌶️🌶️🌶️ au fil de la partie, avec un peu de hasard.
- **Aléatoire** : toutes les intensités sont mélangées.

Le choix se fait à l'accueil et reste mémorisé sur l'appareil.

## Feuilles à imprimer

Accessibles depuis l'écran **Règlements** (section « À imprimer »), ou directement :

- `print/reponses.html` (ou `tengo-yo-reponses.pdf`) : une par joueur. Le code QR est l'image `print/qr-tengoyo.png`, qui pointe vers `https://patricepoliquin.com/tengoyo/`. Si l'adresse du jeu change, il faut régénérer cette image (et le texte sous le QR dans `reponses.html`).
- `print/pointage.html` : une par table. Inscrivez le nom des équipes en haut des colonnes, comptez les points en bâtons (le 5ᵉ barre les 4 autres) et tracez une ligne à la fin de chaque partie.

Dans la fenêtre d'impression, choisir le format Lettre et décocher « En-têtes et pieds de page ».

## Ajouter des questions

Dans `data/questions.json` :

```json
{ "id": "q101", "text": "Un endroit insolite pour un premier baiser", "spice": 1, "category": "seduction" }
```

- `id` : unique.
- `text` : 70 caractères max, formulé pour que **la réponse naturelle tienne en un seul mot** (voir ci-dessous).
- `spice` : intensité de 1 à 3 (voir ci-dessous).
- `category` : general, quotidien, loufoque, humour-noir, double-sens, seduction, soiree, corps, fantasmes, confessions, couple, quebec.

### Niveaux d'intensité

Le ton du jeu est loufoque et irrévérencieux, dans l'esprit des party games à compléter. **Pas de contenu sexuel explicite.**

| Niveau | Libellé | Contenu | Exemple |
| --- | --- | --- | --- |
| 1 | Loufoque | Absurde, quotidien, Québec, situations à compléter. | « Dans 1000 ans, notre monnaie sera le/la… » |
| 2 | Irrévérencieux | Double sens, humour noir, malaises. | « Le monde ne finira pas dans un bang, mais avec un… » |
| 3 | Coquin | Flirt, sous-entendus, jamais explicite. | Un méchant de dessin animé étrangement sexy |

Sont exclus : les cartes qui nomment des pratiques sexuelles ou les parties intimes, le vocabulaire cru, les personnes réelles, les stéréotypes visant un groupe.

### Règle d'or : une réponse = un mot

En 15 secondes, on écrit un mot, pas une phrase. Si la réponse instinctive dépasse un mot, la carte est à reformuler.

| À éviter (réponse en phrase ou en titre) | Préférer (réponse en un mot) |
| --- | --- |
| Une excuse pour ne pas répondre à un texto | « J'ai pas vu ton texto, j'étais dans la… » |
| Un film parfait pour un « Netflix and chill » | Un genre de film pour un « Netflix and chill » |
| Un mensonge classique au premier date | Ce qu'on ment sur son profil de rencontre |
| Une célébrité qu'on a imaginée au lit | Le prénom d'une vedette qu'on a imaginée au lit |

Les formes qui marchent : « Un/Une + nom » (objet, lieu, partie du corps, aliment), « Le nombre de… », « Le premier mot qu'on dit quand… », « Un verbe pour dire… », ou une phrase à compléter qui finit par « … ».
Les formes à éviter : excuses, raisons, « une chose qu'on fait », titres (films, chansons) et noms complets de personnes.

## Logo

`assets/img/logo.webp` est généré depuis `ref/logo/logo-stacked-20261127-1022-2.png` : fond blanc extérieur détouré en transparence (les blancs internes, crâne et reflets, sont conservés), recadré et redimensionné à 720 px de large.
Il apparaît sur l'accueil et sur l'écran de fin. Pour changer de logo, remplacer ce fichier en gardant un fond transparent.
