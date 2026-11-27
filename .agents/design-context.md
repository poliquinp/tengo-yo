# Design context : Tengo Yo

Référence de marque pour toute image produite (partage social, vignettes, affiches).
Source : `ref/` (charte Día de Muertos, logo, polices).

## Style

Archétype : festif et irrévérencieux, Día de Muertos mexicain (papel picado, cempasúchil, calaveras), fond noir.
Ton : loufoque, party game entre amis, québécois. Pas de contenu sexuel explicite.

## Couleurs

| Rôle | Nom | Hex |
| --- | --- | --- |
| Ancre / accent principal | Cempasúchil | `#FF9A00` |
| Accent secondaire | Rosa mexicano (papel picado) | `#FF007F` |
| Fond | Luto (noir) | `#000000` |
| Texte sur fond sombre | Calavera (blanc) | `#FFFFFF` |
| Touches | Verde | `#00A859` |
| Touches | Rojo | `#FF0000` |
| Touches | Cielo | `#0077C8` |

Fond type : noir avec halos radiaux rose (en haut) et orange (en bas), comme l'app.

## Typographie

- Titres et emphase : **Luchados** (`assets/fonts/Luchados.woff`). Pas de glyphes `·`, `—`, `×`, `−` dans cette police.
- Texte : **Open Sans** variable 300-800 (`assets/fonts/open-sans-wght.woff2`), en 700-800 pour les images.

## Éléments graphiques

- Logo : `assets/img/logo.webp` (squelette mariachi + « TENGO YO », fond transparent, 720 x 1010).
- Dos de carte : `assets/img/card-back.webp` (720 x 1080).
- Face de carte : `assets/img/card-front.webp` (cadre papel picado rose).

## Formats

| Usage | Taille | Fichier |
| --- | --- | --- |
| Partage Facebook / Open Graph / X | 1200 x 630 | `assets/social/og-image.jpg` |

## Génération

Gabarits HTML dans `tools/social/`, rendus en image par Chrome :

```bash
node tools/social/render.mjs tools/social/og-image.html assets/social/og-image.jpg --size 1200x630
```
