# Rozprávková Akadémia

Statická webová stránka slovenského vzdelávacieho projektu pre rodičov a deti od 4 do 10 rokov. Ponúka poučné rozprávky o ľudskom tele, prírode, emóciách, vede a vesmíre.

Toto je statické MVP: čisté HTML, CSS a malý JavaScript pre mobilné menu. Bez frameworkov, databázy aj build procesu.

## Ako spustiť

Stačí otvoriť `index.html` alebo `story.html` v prehliadači.

Voliteľne môžete spustiť lokálny server v priečinku projektu:

```bash
python3 -m http.server 43127
```

Potom otvorte [http://127.0.0.1:43127](http://127.0.0.1:43127) alebo [http://127.0.0.1:43127/story.html](http://127.0.0.1:43127/story.html).

## Súbory

- `index.html` — titulná stránka
- `stories.json` — zdroj údajov pre všetky rozprávky
- `stories/story-template.html` — šablóna podstránky rozprávky
- `stories/story.html` — ručná kópia šablóny
- `stories/` — vygenerované HTML stránky rozprávok
- `stories/content/` — skutočný text rozprávky (ak už existuje)
- `scripts/generate-stories.js` — vygeneruje všetky stránky zo `stories.json`
- `categories/` — landing pages kategórií
- `categories/category-template.html` — šablóna novej kategórie
- `styles.css` — spoločný dizajn titulky, kategórií aj rozprávok
- `script.js` — otváranie, zatváranie a klávesnicové ovládanie mobilného menu

## Šablóna rozprávky

Stránky rozprávok sa generujú zo `stories.json` a `stories/story-template.html`:

```bash
node scripts/generate-stories.js
```

Skutočný text vložte do `stories/content/{slug}.html` a znova spustite generátor.
Prípadne ho vložte priamo medzi komentáre na vygenerovanej stránke:

```html
<!-- STORY CONTENT START -->
<!-- STORY CONTENT END -->
```

Súvisiace rozprávky a predchádzajúca / ďalšia rozprávka sa berú z poradia a kategórií v `stories.json`.

## Šablóna kategórie

Novú kategóriu vytvoríte skopírovaním `categories/category-template.html`. Na `body` nastavte jednu z tried `theme-blue`, `theme-green`, `theme-purple`, `theme-pink` alebo `theme-orange`.

## Pripravené na ilustrácie

- široký hero placeholder na titulke
- veľký cover blok na podstránke rozprávky
- pomerové bloky na kartách rozprávok (16 / 10)
- hero, karty a odporúčaná rozprávka na stránkach kategórií (`data-illustration`)
