# SkyLens V1 — Správa za Stage 2

Dátum: 2026-11-01. Vetva `skylens-rn`, nič nie je pushnuté a TestFlight sa nezmenil. Stav je overený testami a na webe. Na iOS ani na iPhone Stage 2 nebežal.

## 1. Čo je hotové

| Bod zadania | Výsledok |
|---|---|
| Kontextový panel (DISC-003) | Tri stavy: zbalený riadok, polovica a celý. Otvára sa klepnutím aj ťahom, obloha nad ním ostáva živá |
| Univerzálne vyhľadávanie | Planéty, súhvezdia, deep-sky a všetkých 118 217 hviezd, s kategóriami, preklepmi a nedávnymi objektmi |
| Výber objektu | Jedna karta, voľná nad oblohou alebo v paneli. Pribudli dlhé podržanie, šípky medzi objektmi, zvýraznenie súhvezdia a pridanie do zoznamu |
| Detail objektu | Údaje podľa typu, päť súradnicových sústav, graf výšky cez noc, súvisiace objekty a pridanie do zoznamu |
| Find in Sky | Plynulý let, ktorý sleduje pohybujúci sa cieľ. Karta dáva pokyny typu „Turn right 47°, tilt down 5°“ |
| Kontextové objavovanie | Zoznam „Around this view“ sa mení s pohľadom, režimom, miestom a časom |
| Obľúbené a zoznamy | Vlastné zoznamy, premenovanie, poradie, mazanie a uloženie po reštarte |
| Gestá | Ťah, priblíženie, klepnutie, dlhé podržanie a panel sa navzájom nerušia na webe |

Znovu použité sú existujúci renderer, engine, priestorový index a obrazovka detailu. Vyhľadávanie je jeden zdieľaný zoznam pre panel aj obrazovku Search.

## 2. Testy

| Kontrola | Výsledok |
|---|---|
| Typová kontrola | Bez chýb |
| Unit a vedecké testy | 163 z 163, 2 merania výkonu sú predvolene preskočené |
| Webové toky | 39 z 39, z toho 27 zo Stage 0 a 1 |
| Explore oproti pôvodnej verzii | 0,007 % zmenených pixelov mimo prepínača režimov a nového riadku |
| iOS Simulator a fyzický iPhone | **Nebežalo**, bez pushu |

## 3. Chyby nájdené pri overovaní

| Chyba | Dôsledok | Stav |
|---|---|---|
| Výberový krúžok nesledoval vlastný pohyb hviezdy | V Time Travel sa odtrhol od rýchlej hviezdy | Opravené, pod 0,5″ v rokoch 1815 aj 2150 |
| Jedno gesto v dvoch detektoroch | Pád aplikácie „No handler for tag“ | Opravené |
| Dve kópie karty výberu naraz | VoiceOver by ju čítal dvakrát | Opravené |
| Observe ponúkal Neptún s magnitúdou 7,9 | Nesprávna rada pre voľné oko | Opravené |
| Jasný Mesiac mimo pohľadu bol pred objektmi v pohľade | Zoznam nezodpovedal pohľadu | Opravené |
| Šípky späť sa nevrátili na predchádzajúci objekt | Zoznam sa po každom kroku preusporiadal | Opravené |

## 4. Astronómia

Referencie sú rovnaké ako v Stage 1. Všetky vedecké testy prešli a správa `VALIDATION_REPORT.json` je znovu vygenerovaná. Pribudlo:

| Kontrola | Výsledok |
|---|---|
| Plocha 88 súhvezdí | 41 253,0 štvorcových stupňov, celá sféra má 41 252,96 |
| Plochy podľa IAU | 7 kontrolovaných súhvezdí v rozmedzí 2 % |
| Vrchol grafu výšky oproti enginu | V rámci jednej vzorky, 20 minút |
| Galaktická poloha Síria | Zhoda s publikovanou hodnotou na 0,1° |
| Absolútna magnitúda Síria a Vegy | Zhoda s publikovanými hodnotami na 0,1 |

Nič sa nedopĺňa odhadom. Ak hodnota chýba, riadok sa nezobrazí. Povrchová teplota je označená ako odvodená z farby.

## 5. Licencie

Žiadny nový dataset ani obrázok. Balík hviezd narástol o 0,7 MB, lebo obsahuje index čísel HIP a označenia HD, HR a spektrálne typy z toho istého Hipparcosu a Yale katalógu. Dostupné boli už predtým v `stars-meta.tsv`. HOLD zdroje zostávajú vypnuté a licenčné otázky zo Stage 1 sú stále otvorené.

## 6. Čo chýba

- **Vyhľadávanie hviezd z balíka:** ide len podľa čísla HIP a 43 mien, lebo zdroj pre ne iné označenia nemá.
- **Galéria v detaile:** chýbajú ďalšie schválené obrázky. Bez obrázka sa ukáže skutočná obloha.
- **Long press:** nemá akciu tag, tá patrí k `DISC-006`.
- **Poradie v zoznamoch:** ide cez tlačidlá hore a dole, nie ťahaním. Fungujú s VoiceOverom.
- **Kategórie satelitov a komét:** čakajú na Stage 4.

## 7. Riziká na iOS

Web nič z tohto nedokazuje. Všetko patrí do spoločného testu na iPhone.

| Riziko | Prečo | Čo overiť |
|---|---|---|
| Čítanie balíka zo súboru | `File.open()` na súbore v balíku aplikácie zatiaľ nikdy nebežal | Deep Atlas, „HIP 87937“ |
| Prvé vyhľadávanie | Index trvá v Node 98 ms a Hermes je bez JIT rádovo pomalší, obloha môže krátko zastať | Prvé otvorenie vyhľadávania |
| Plynulosť panela | Ťah beží na JS vlákne | Ťah panela, keď sa pohybuje obloha |
| Súbeh gest | Rozhodovanie medzi ťahom, klepnutím a podržaním je na iOS iné než na webe | Podržanie, ťah hneď po ňom, priblíženie dvoma prstami |
| Posúvanie v paneli | Gesto panela obaľuje `ScrollView` | Celý panel, posun zoznamu, ťah späť |
| Klávesnica | Panel a dialóg zoznamu majú iné správanie s klávesnicou | Písanie v paneli a pri novom zozname |
| Graf Mesiaca | 73 vzoriek efemeríd trvá v Node 50 ms, preto sa počíta až po vykreslení záložky | Záložka Observing pri Mesiaci |
| Compass a Find in Sky | Pokyny sú overené len logikou, senzory nie | Find in Sky s kompasom |
| Haptika a VoiceOver | Na webe sa nedajú overiť | Podržanie, stavy panela |

Toky `maestro/06`, `07` a `08` sú pripravené, ale nikdy nebežali.

## 8. Ďalší krok

Stage 3: 3D Slnečná sústava a Moon Atlas. Pred Moon Atlas treba rozhodnúť o zdroji máp Mesiaca, lebo LROC je v `ASSET_CREDITS.md` vedený ako obmedzený.
