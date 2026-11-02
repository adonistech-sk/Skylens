# SkyLens V1 — Kontrolný zoznam na iPhone

Pre interných testerov TestFlight. Build: **SkyLens 1.0.0 (1002)**, commit `d36d01f`. Popisy tlačidiel sú v angličtine, ako v aplikácii.

Pri každej chybe zapíš: čo si robil, čo sa stalo, model iPhonu, verziu iOS a snímku obrazovky. Pád nahlás cez TestFlight, aby prišiel aj záznam o páde.

## Pred testom

- [ ] V TestFlight je nainštalovaný build 1.0.0 (1002). Číslo buildu je na stránke aplikácie v TestFlight.
- [ ] Zapísaný model iPhonu, verzia iOS a či má ProMotion (120 Hz).
- [ ] Aspoň jeden test prebieha vonku za tmy, kvôli kompasu a AR.

## Prvé spustenie

- [ ] Onboarding sa dokončí a otvorí sa obloha.
- [ ] Povolenie polohy: **Use Current Location** dá správne mesto a oblohu.
- [ ] Zamietnutie polohy nezablokuje aplikáciu, dá sa zadať ručne.

## Sky Map

- [ ] Ťah otáča oblohu plynulo a po pustení sa zastaví.
- [ ] Dva prsty približujú okolo miesta medzi prstami (pinch ešte nikdy nebol overený na iOS).
- [ ] Klepnutie vyberie hviezdu pod prstom a otvorí kartu, karta otvorí detail.
- [ ] Prepínanie **Observe**, **Explore** a **Deep Atlas** nepohne žiadnym objektom.
- [ ] V Deep Atlas sa pri veľkom priblížení objavia ďalšie hviezdy.
- [ ] Hľadanie „HIP 87937“ nájde Barnardovu hviezdu a tlačidlo „Show in Deep Atlas“ na karte ju ukáže.
- [ ] **Layers**: každý prepínač niečo viditeľne zmení.
- [ ] Night vision sfarbí všetko načerveno.
- [ ] Kompas a smer: obloha sa zhoduje so svetovými stranami, **Find in Sky** dovedie k objektu.

## Sky Discovery

- [ ] Panel sa potiahne hore a dole, kým sa obloha hýbe, a nič sa nezasekne.
- [ ] Prvé otvorenie hľadania nezastaví oblohu nápadne dlho.
- [ ] Písanie v paneli funguje, klávesnica nič neprekryje.
- [ ] Preklep v názve objekt stále nájde.
- [ ] Podržanie prsta otvorí ponuku a ťah hneď potom sa nepomýli s gestom.
- [ ] Detail Mesiaca: záložka **Observing** a graf sa ukážu bez dlhého zastavenia.
- [ ] Vlastný zoznam: vytvor ho, pridaj objekt, zmeň poradie, reštartuj aplikáciu a zoznam ostane.
- [ ] **Tonight** ukazuje objekty, ktoré sú dnes naozaj viditeľné.

## Solar System

- [ ] **Explore → Solar System in 3D** sa otvorí a planéty sa vykreslia, nie čierne kruhy (v simulátore fungujú, na skutočnom GPU iPhonu ešte nebežali).
- [ ] Klepnutie na Jupiter vyberie Jupiter (raz sa vybrala Venuša).
- [ ] Prelet na Jupiter a Io, potom späť na prehľad. **Aplikácia nesmie spadnúť:** pred buildom 1002 tu padala.
- [ ] Rovnaký prelet na ďalšie planéty a mesiace, napríklad Saturn, Mars a Europa.
- [ ] Play, Pause a **Now** menia a vracajú čas.

## Moon Atlas

- [ ] **Explore → Moon Atlas** sa otvorí, zemeguľa Mesiaca je ostrá a so správnou textúrou.
- [ ] Otáčanie a priblíženie sú plynulé, krátke zadrhnutie pri prvej 2K mape si zapíš.
- [ ] Hľadanie „Tycho“ dovedie ku kráteru a ukáže kartu.
- [ ] Označené sú reálne útvary, pri póloch je obraz mäkší (očakávané).

## Constellations

- [ ] Figúry sa na oblohe zobrazia. V simulátore fungujú, na skutočnom GPU iPhonu ešte nebežali.
- [ ] Figúra sedí na hviezdach pri otáčaní a približovaní.
- [ ] Klepnutie do prázdna vnútri Oriona vyberie súhvezdie, jasná hviezda pod prstom má prednosť.
- [ ] Detail Oriona: príbeh sa dá čítať, text sa neprekrýva s oblohou.
- [ ] **Guided exploration**: spustenie, ďalšia zastávka, ukončenie.
- [ ] **Layers**: figúry, čiary a **Artwork opacity** fungujú samostatne.
- [ ] Pri rýchlom otáčaní cez viac súhvezdí nenastáva dlhé zaseknutie.
- [ ] S Reduce Motion sa figúry objavia bez animácie.

## Time Travel

- [ ] Ikona kalendára na oblohe otvorí **Time Travel**.
- [ ] Posun dopredu a dozadu pohybuje oblohou, Play a Pause fungujú.
- [ ] Figúry a hviezdy sa pri roku 2199 a 1801 od seba neoddelia.
- [ ] **Now** vráti aktuálny čas a zmizne označenie simulovaného času.

## AR

- [ ] Povolenie kamery a pohybu, potom sa ukáže živý obraz s oblohou.
- [ ] Vonku sa Mesiac alebo jasná hviezda kryje so značkou. Odhadni odchýlku v stupňoch.
- [ ] Otočenie telefónu v každom smere drží zarovnanie, kompas nezačne plávať.
- [ ] Spúšť uloží fotku do Fotiek, až po povolení.
- [ ] Zamietnutie kamery ukáže jasnú správu, aplikácia nespadne.

## Offline

Zapni režim Lietadlo a úplne ukonči aplikáciu.

- [ ] Studené spustenie ukáže oblohu.
- [ ] Hľadanie, detail, Deep Atlas, Solar System, Moon Atlas a súhvezdia fungujú.
- [ ] Time Travel funguje.
- [ ] Ručný výber mesta funguje, mestá sú v aplikácii.
- [ ] **Use Current Location** bez siete ukáže súradnice namiesto názvu mesta a obloha je správna.
- [ ] Po vypnutí režimu Lietadlo sa nič nepokazí.

## Výkon

**Aplikácia meria iba čas zápisu snímky v JS vlákne.** Nemeria FPS ani pamäť a nezahŕňa prácu GPU. Čísla nižšie zapisuj presne, nič z nich neprepočítavaj na FPS.

Kde ich nájdeš: na oblohe **Layers**, úplne dole časť **On this device**. Riadok `Frame JS` ukazuje p50, p95, najhorší čas a počet snímok, ďalšie riadky hviezdy a stav balíka. Hodnoty sa obnovujú každú sekundu z posledných 240 snímok. Panel existuje len pre oblohu, nie pre Solar System ani Moon Atlas.

Spätne porovnať staré správanie: **More → Sky engine** vypne **Spatial star index**, **Sky modes** alebo **Deep star pack** bez nového buildu.

| Scenár, 1 minúta ťahania | p50 ms | p95 ms | worst ms | Plynulé? áno/nie |
|---|---|---|---|---|
| Explore, predvolené | | | | |
| Deep Atlas, veľké priblíženie | | | | |
| Veľká figúra na celej obrazovke | | | | |

Rozpočet PRD je p95 ≤ 20 ms, ale toto číslo pokrýva iba JS, takže plynulosť hodnotí aj oko.

- [ ] Studený štart: zmeraj stopkami sekundy po obrazovku s oblohou.
- [ ] 20 minút používania: aplikácia nespadne, nezačne sa spomaľovať.
- [ ] Telefón sa neprimerane nezohrieva. Zapíš pokles batérie v percentách za 20 minút.

## Známe regresie a slabé miesta

Tieto už vieme, zapíš iba to, či sa potvrdili na iPhone.

- [ ] Klepnutie na planétu v Solar System vybralo inú planétu. Na webe sa to nezopakovalo.
- [ ] Odkaz otvorený počas studeného štartu sa môže stratiť. V CI to pravdepodobne raz z troch behov zlyhalo.
- [ ] Prvé otvorenie hľadania môže chvíľu zastaviť oblohu.
- [ ] V detaile Oriona môže názov hviezdy (Aldebaran) presvitať pod tlačidlami hore. Je to kozmetická chyba.
- [ ] Barnardova hviezda nemá vo výsledkoch hľadania obrázok. Je to kozmetická chyba.
- [ ] Prvé dekódovanie obrázkov (mapa 2K, nové súhvezdie) môže spôsobiť krátke zadrhnutie.
- [ ] Moon Atlas je pri najbližšom priblížení mäkký, mapa končí na 8K.

Očakávané, nie sú to chyby tohto testu:

- Corona Borealis a Puppis nemajú figúru, 22 figúr je iba „prijateľných“ (pozri `V1_CONSTELLATION_MATRIX.md`).
- Príbehy súhvezdí nie sú celé fakticky overené.
- Mesiace sú iba náš Mesiac a štyri Galileove.
- Nákup Pro sa tu netestuje. **Events → Calendar** a dlhšie zoznamy preto vedú na paywall.
