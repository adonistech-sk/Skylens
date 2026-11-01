# SkyLens V1 — DATA_SOURCE_AUDIT

**Dátum:** 2026-11-01 · **Stav:** externý audit oficiálnych zdrojov dokončený v rozsahu nižšie; **interný audit SkyLens blokovaný neprítomným repozitárom**.  
**Rozsah overenia:** verejné dokumentácie a zmluvné podmienky. **Nie** analýza používanej aplikácie, nie právne stanovisko a nie povolenie všetkých datasetov na redistribúciu.

## A. Súčasný stav SkyLens — iba preukázateľné informácie

V knižnici je dostupná technická špecifikácia `MASTER_CLAUDE_CODE_PROMPT.md` a vizuálny manifest `SKYLENS_VISUAL_REFERENCES.md`. Prvý dokument stanovuje Expo/React Native + TypeScript architektúru, zachovanie pôvodných SwiftUI/Metal modulov, jedno spoločné `ObserverContext` a požiadavku na reálny astronomický renderer; nepreukazuje, že tieto moduly alebo dátové zdroje v aktuálnom builde naozaj existujú. Druhý obsahuje zdrojové odkazy na referenčné vizuály, nie audit vykonaných importov. **Nie sú známe aktuálne závislosti, API kľúče, databázy, schema, latencie, počty objektov ani presnosť SkyLens.**

### Povinný inventár po prístupe k repozitáru

1. Uzamknúť baseline branch/commit a otestovať existujúci build na iPhone.
2. `rg -n "gaia|hipparcos|hyg|openngc|ngc|jpl|horizons|sbdb|celestrak|tle|omm|noaa|meteor|lro|iau|weather|lightpollution|fetch\(|https?://" .`; prejsť aj `package.json`, `Podfile`, Swift, SQL, bundlované binárne súbory, iOS Asset Catalogs a runtime sieťové logy.
3. Pre každý nález uložiť súbor/riadok, reálny endpoint, dodávateľa, zdrojovú verziu, licenčný dokument, typ ukladania, dátum a testy; preveriť aj skryté fallbacky a hardcoded sample objekty.
4. Urobiť pred/po porovnanie 10 existujúcich obrazoviek a scenárov Sky/AR/Tonight/Time Travel a zamedziť neplánovaným zmenám UI.
5. Všetko bez dôkazu označiť **UNVERIFIED**; nedoplniť ho domnienkou.

## B. Externý register zdrojov, práv a formátov

**Stavy:** `CONDITIONAL` = známe pravidlá, pred produkciou overiť konkrétny zdrojný súbor/produkt; `HOLD` = neexistuje dostatočný preukázaný právny základ pre zamýšľanú komerčnú redistribúciu; `POTENTIAL` = otvorené údaje s uvedenými podmienkami, ale ešte neimportované. Kadencia je **plán synchronizácie**, nie zaručená vydavateľská frekvencia, okrem výslovnej oficiálnej frekvencie.

| Zdroj / scope | Formát / aktuálnosť | Komerčné použitie a redistribúcia | Atribúcia a podmienky | Stav |
|---|---|---|---|---|
| **ESA Gaia DR3** `gaia_source` | ADQL/TAP, CSV/ECSV, FITS; statická vydaná verzia; kontrolovať errata a DR3 release | Verejne dostupný vedecký katalóg; podmienky **zabalenia podmnožiny do platenej aplikácie a jej redistribúcie** musia byť právne zdokumentované voči oficiálnym terms, nie extrapolované z otvoreného API | Citácia ESA Gaia/DPAC a dátovej verzie; ICRS epoch **J2016.0**; `pmra` je μ_α* | **HOLD na produkčný import** |
| **NASA JPL Horizons** | API GET/POST; JSON obal s textovým ephemeris payloadom, voliteľný text; dynamické výpočty, plán cachovania 1–24 h podľa objektu | Štátny vedecký systém; pred redistribúciou vypočítaných hromadných efemeríd overiť JPL podmienky, rozumné API limity a metadata | NASA/JPL, verzia, epoch, `CENTER`, timescale, frame, jednotky, uplatnené korekcie | **CONDITIONAL** |
| **JPL SBDB** | JSON object/orbit/physical, štruktúra so `signature.version`; plán denný/pri novej orbit solution | API verejný; komerčné masové mirrorovanie a dlhodobá redistribúcia súborov preveriť osobitne | NASA/JPL, solution ID, epoch (TDB), orbit uncertainties | **CONDITIONAL** |
| **IAU súhvezdia** | J2000 TXT hraníc, 88 oficiálnych oblastí; takmer nemenné | IAU poskytuje súradnice hraníc, ale **licenciu redistribúcie konkrétneho súboru a obrázkov má preveriť reviewer**; IAU neschvaľuje jednotné „stick figures“ | IAU, zdroj/odkaz, verzia súboru; odlíšiť hranice od autorských spojníc | **HOLD na import originálneho súboru** |
| **OpenNGC** `NGC/IC` + addendum | Semicolon CSV, J2000 RA/Dec; release/commit, kontrola kvartálne | **CC BY-SA 4.0** umožňuje komerčné použitie za podmienok licencie; odvodená databáza môže vyžadovať share-alike a zverejnenie označenia zmien. Zmiešaná proprietárna DB nesmie bez právnej revízie potlačiť tieto práva | Mattia Verga / OpenNGC, pôvodní prispievatelia, CC BY-SA 4.0, odkaz, zmeny, zdroje v poli `Sources` | **CONDITIONAL, produkčný import HOLD do compliance approval** |
| **CelesTrak GP/SupGP** | preferovať **OMM JSON/CSV/XML** a SGP4; **oficiálne GP updaty každé 2 h**, nežiadať častejšie | Zverejnené usage policy sa týka frekvencie/limitov, nie je dôkazom licencie pre komerčné prebalenie ich feedu; vyžiadať potvrdenie pri serverovej redistribúcii | CelesTrak, origin USSF, `EPOCH`, `NORAD_CAT_ID`, EOP; TLE už nepokrýva nové 6-ciferné IDs | **HOLD redistribúcia** |
| **NASA LRO: LROC, LOLA, PDS** | PDS4 science produkty; geo-referencované raster DEM/GeoTIFF/IMG, tiles; aktualizácia podľa zvoleného release | NASA/PDS obsah typicky US public domain, no skontrolovať konkrétne produktové/third-party položky a mapový tile server | NASA/GSFC, LRO/LROC/LOLA, produkt ID, dátum, projekcia a transformácie | **CONDITIONAL** |
| **USGS Gazetteer** (IAU planetary names) | databáza/publikované exporty, pomenované krátery; mesačná kontrola | Výslovne **public domain** pre Gazetteer; všeobecne pri USGS tretie strany zvlášť | IAU WGPSN / USGS Gazetteer, dátum prístupu | **POTENTIAL** |
| **NASA fotografie a 3D modely** | JPEG/PNG/TIFF/GLB/OBJ/USDZ podľa položky; asset release-on-change | Materiály NASA spravidla US public domain, **nie logá, osobné endorsement ani third-party fotografie/modely**; reklama s NASA logami má vyšší clearance risk | Individuálny kredit NASA/misie/autora, filename a URL | **CONDITIONAL per asset** |
| **ESA hlavná webová galéria** | fotografie/video, release-on-change | ESA všeobecné multimediálne terms **obmedzujú komerčné použitie bez osobitnej licencie**; nemožno paušálne importovať do platenej appky | ©ESA + uvedený autor, súhlas podľa produktu | **HOLD** |
| **ESA/Hubble** (odlišné od esa.int) | fotografie/videos, release-on-change | **CC BY 4.0** umožňuje komerčné využitie pri dodržaní požiadaviek stránky a individuálnych creditov; žiadne ESA endorsement | Viditeľný plný, nezmenený image credit + URL, spracovanie/úpravy | **POTENTIAL per asset** |
| **IMO** meteor-shower calendar | HTML/PDF, cca ročný update a možné opravy | Samotný prístup ku kalendáru neudeľuje oprávnenie na kopírovanie databázy, textov a tabuliek do komerčnej aplikácie; dohodnúť použitie, alebo zostaviť vlastné predikcie z právne preverených dát | IMO, autor kalendára, DOI/rok; radiants/ZHR/peak pri každom ročníku | **HOLD** |
| **NOAA SWPC** | aktuálne JSON/XML/TXT, Kp/aurora/solar alerts podľa jednotlivých feedov; plán 5–30 min, **podľa produktu a etických limitov** | US government data typicky public domain; skontrolovať zvlášť prípadný third-party content a endpoint disclaimer | NOAA/SWPC, `issued_at`, `valid_at`, predpoveď vs meranie, aktualizačný stav | **POTENTIAL** |
| **Komerčné meteorologické dáta** | JSON / tiles / forecast grid; obvykle hodinové vrstvy, podľa kontraktu | Len **konkrétne zakúpené práva** pre komerčnú mobilnú appku, caching, zobrazenie a pri offline storage zvlášť | Vypísaná kreditácia a zákaz rehosting podľa kontraktu | **HOLD do kontraktu** |
| **Komerčné light-pollution dáta** | geotiles GeoTIFF/MBTiles/PNG/raster; ročné či viacročné mapy | Platná zmluva musí pokrývať in-app výrez, cache, offline, export, teritórium, počet používateľov, deriváty | Atribúcia vrstvy, model/map vintage, jednotky a neistoty | **HOLD do kontraktu** |

### Rozhodujúce licenčné riziká

- „Open data“ **nie je automaticky** licencia na prebaliť zdroj do offline plateného App Store balíka.
- **OpenNGC CC BY-SA 4.0** je na rozdiel od väčšiny vedeckých zdrojov konkrétna virálna licencia pre odvodenú databázu. Príslušné DSO balíky a oznamy ponechať oddelene, dátová atribúcia v About / Licenses, pripraviť sprístupnenie odvodených katalógových dát podľa zákonných povinností; schváliť interpretáciu právnikom.
- **esa.int** mediálna licencia sa nesmie stotožniť s **esahubble.org CC BY 4.0**.
- JPL **SBDB dáva elementy dráh**, Horizons dáva efemeridy pre konkrétne časy a observer; elementy samé nie sú presná náhrada za gravitačne integrované topocentrické výpočty.
- Satelitné TLE/OMM **nie sú** presnými polohami po ľubovoľne dlhom čase bez nových elementov; age-of-elements a quality status musia byť zobrazené používateľovi.
- Neskopírovať žiadne interné API, obrázky, databázy, 3D assety, užívateľsky neviditeľné feedy Night Sky/konkurentov bez povolenia.

## C. Linky na primárne dôkazy (kontrolované 2026-11-01)

- ESA Gaia DR3: https://gea.esac.esa.int/archive/ ; credits: https://gea.esac.esa.int/archive/documentation/GDR3/Miscellaneous/sec_credit_and_citation_instructions/ ; metadata: https://gaia.aip.de/metadata/gaiadr3/
- JPL Horizons: https://ssd-api.jpl.nasa.gov/doc/horizons.html ; https://ssd.jpl.nasa.gov/horizons/manual.html ; SBDB: https://ssd-api.jpl.nasa.gov/doc/sbdb.html
- IAU: https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx
- OpenNGC: https://github.com/mattiaverga/OpenNGC ; format: https://github.com/mattiaverga/OpenNGC/blob/master/NGC_guide.txt
- CelesTrak: https://celestrak.org/usage-policy.php ; https://celestrak.org/NORAD/documentation/gp-data-formats.php
- NASA LRO: https://science.nasa.gov/mission/lro/data-products/ ; NASA moon textures: https://svs.gsfc.nasa.gov/4720
- USGS: https://planetarynames.wr.usgs.gov/Page/FAQ ; https://www.usgs.gov/faqs/are-usgs-reportspublications-copyrighted
- NASA media: https://www.nasa.gov/nasa-brand-center/images-and-media/
- ESA main site media: https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website
- ESA/Hubble media: https://esahubble.org/copyright/
- IMO: https://www.imo.net/calendar/
- NOAA SWPC: https://services.swpc.noaa.gov/products/ ; https://services.swpc.noaa.gov/json/

## D. Release gate / evidence checklist pre každý dataset

`source_id`, `dataset_uri`, `exact_release_or_git_sha`, `retrieved_utc`, `bytes`, `sha256`, `format`, `license_uri`, `commercial_allowed_proof`, `redistribution_allowed_proof`, `attribution_exact`, `derivative_rights`, `offline_cache_allowed`, `rate_limit_or_request_policy`, `reviewer`, `reviewed_at`, `expiry_or_review_date`, `data_validation_report`, `release_hash`.

**Bez pozitívneho dôkazu** import nezapnúť, bez schválenia licencie nepublikovať. V dodanom kóde sa preto `fixtures/rights.json` vydáva s explicitnými `false` hodnotami a importovací CLI failuje ešte pred spracovaním datasetu.
