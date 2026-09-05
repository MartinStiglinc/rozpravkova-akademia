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
- `story.html` — šablóna podstránky rozprávky (prvý príbeh *Prečo musíme spať*)
- `styles.css` — spoločný dizajn titulky aj rozprávok
- `script.js` — otváranie, zatváranie a klávesnicové ovládanie mobilného menu
- `stories/` — priečinok pre budúce súbory rozprávok

## Šablóna rozprávky

Text rozprávky vkladajte v `story.html` medzi komentáre:

```html
<!-- STORY CONTENT START -->
<!-- STORY CONTENT END -->
```

Pri kopírovaní do `/stories/` zmeňte cesty na `../styles.css`, `../script.js` a `../index.html`.

## Pripravené na ilustrácie

- široký hero placeholder na titulke
- veľký cover blok na podstránke rozprávky
- pomerové bloky na kartách rozprávok (16 / 10)
