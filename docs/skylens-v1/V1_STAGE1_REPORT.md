# SkyLens V1 — Správa za Stage 0 a Stage 1

Dátum: 2026-11-01. Vetva `skylens-rn`, kontrolný bod `skylens-v1-stage0-baseline` na `ff8ab8e`.

## 1. Čo sa zmenilo

| Oblasť | Výsledok |
|---|---|
| Režimy oblohy | Observe, Explore a Deep Atlas. Každý si pamätá vlastné vrstvy. Predvolený je Explore, aby aplikácia vyzerala ako doteraz |
| Vrstvy | Panel s 18 vrstvami, 3 posuvníkmi, tlačidlom Reset a meraním na zariadení |
| Katalóg | Priestorový index s 1 536 bunkami a hlboký balík 76 806 hviezd, načítavaný po dlaždiciach |
| Mapa | Rovníková, horizontálna, ekliptická a galaktická sieť, hranice súhvezdí, symboly objektov, údaj o zornom poli a mierka |
| Výber | Klepnutie zasiahne len to, čo je nakreslené. Karta má Locate, Learn, Save. Pribudla šípka k objektu mimo obrazovky |
| Gestá | Priblíženie sa drží prstov |
| Návrat späť | Prepínače v More → Sky engine |

Kód je v `skylens-rn/src/data/catalogs/`, `src/features/sky/` a `src/state/`. Commity sú v histórii vetvy.

## 2. Overené a chýbajúce

| Kontrola | Výsledok |
|---|---|
| Typová kontrola | Bez chýb |
| Testy | 103 z 103 prešlo. 1 meranie výkonu je predvolene preskočené |
| Webové toky | 27 z 27, z toho 14 pôvodných |
| Každý prepínač mení obraz | Áno, overené tokmi |
| Zlyhanie balíka | Aplikácia to oznámi a kreslí ďalej |
| Fyzický iPhone | `DEVICE_NOT_TESTED` |

**Chýba:** umelecké figúry pre 87 súhvezdí, príbehy súhvezdí, dlhé podržanie a overenie gest na iOS. Satelity a dráhy nie sú v paneli, lebo pre ne nie sú dáta. Vyhľadávanie zatiaľ nepozná hviezdy z hlbokého balíka.

**Známe obmedzenie:** na webe sa pri začiatku priblíženia obraz posunie o polovicu kroku prsta, lebo web spracúva každý prst zvlášť. Pri bežnom kroku to je pod 1 bod. Na iOS sa to nepotvrdilo ani nevylúčilo.

## 3. Astronómia

| Kontrola | Referencia | Prípady | Najhorší výsledok | Limit |
|---|---|---|---|---|
| Slnko, Mesiac, planéty | JPL Horizons | 450 | 18,43″ | 60″, Mesiac 120″ |
| Hviezdy a deep-sky | ERFA | 875 | 22,04″ | 25″ |
| Hviezdy katalógu | SIMBAD | 394 | 1,44″ | 2″ |
| Poloha na obrazovke | ERFA | 1 191 | 1,20 bodu | 1,5 bodu |
| Priestorový index | Úplné prehľadanie | 304 931 hviezd | 0 chýbajúcich | 0 |

Referencie boli zmrazené 2026-11-01. Všetky prípady sú vo `VALIDATION_REPORT.json`, vysvetlenie vo `V1_SCIENCE_VALIDATION.md`. Toto nie je certifikácia.

**Opravená chyba:** pri obzore bol výberový krúžok až 35,85′ od planéty alebo Mesiaca.

**Chyby v zdrojoch:** HIP 67593, 75901 a 17750 majú zlé alebo chýbajúce údaje v Hipparcose. M39, M41 a M67 sú 13′ až 15′ od moderného stredu. Všetky sú menovite v testoch a v `V1_SCIENCE_VALIDATION.md`.

## 4. Licencie

| Dataset | Stav |
|---|---|
| Gaia DR3, OpenNGC, súbor hraníc IAU, CelesTrak | **HOLD, neimportované** |
| Hlboký balík | Rovnaký Hipparcos ako doteraz, žiadny nový zdroj. Komerčná kontrola stále otvorená |
| Hranice súhvezdí | d3-celestial, BSD-3, súbor už bol v repozitári. Pôvod figúr sa stále preveruje |
| NGC 2000.0 | Otvorené, najvyššia priorita, deep-sky sa nerozširoval |
| Meteorické roje z IMO | Otvorené, audit ich vedie ako HOLD |
| Orion a obrázok lokality z AI | Otvorené |

Podrobnosti sú vo `V1_SOURCE_MATRIX.md`.

## 5. Vizuál a merania

Explore sa od pôvodnej verzie líši v 29 z 1 170 354 pixelov (0,002 %) mimo nového prepínača. Webové zábery sú v `evidence/stage1/` a porovnanie v `evidence/compare/stage1_sheet.jpg`.

Pri kontrole záberov sa našli a opravili tieto odchýlky: údaj o zornom poli prekrýval názvy, Observe nepomenoval Betelgeuse, panel mal na webe tyrkysové prepínače a pri veľkom priblížení vznikali falošné ružové hmloviny. Tie spôsobovala hrubá mapa Mliečnej cesty, preto v Deep Atlas pri priblížení vybledne.

Cyklus hviezd skenuje pri 26° 4 414 hviezd namiesto 41 411. Čas v Node klesol z 1,40 na 0,19 ms, čo je iba porovnanie na tomto PC. **Snímkovú frekvenciu, pamäť ani batériu na iPhone sme nemerali.** Panel Layers ich už na zariadení ukáže.

## 6. Ďalší krok

1. Spustiť iOS CI na tomto kóde a skontrolovať načítanie balíka zo súboru a nové toky.
2. Na iPhone otvoriť Layers v Deep Atlas a zapísať časy z panela.
3. Potom Stage 2: `DISC-003`, kontextový panel oblohy. Patrí tam aj vyhľadávanie hviezd z balíka.
