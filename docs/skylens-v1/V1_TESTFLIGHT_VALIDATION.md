# SkyLens V1 — Interný TestFlight build pre test na iPhone

Stav k 2026-11-02, 14:22 UTC. Tester s build 1002 ešte nehlásil žiadny výsledok, preto tu nie sú žiadne údaje zo zariadenia.

## Build

| Položka | Hodnota |
|---|---|
| Aplikácia | SkyLens Astronomy, `sk.skylens.app`, App ID 6829398765 |
| Verzia a build | **1.0.0 (1002)** |
| Git SHA | **`d36d01facaec54ba7129ae7f6dae512c006b5833`** |
| Vetvy | `skylens-rn` a `rn-testflight`. `main` ostáva na `88592c0` |
| Záchytný bod | Lokálny tag `skylens-v1-stage4-prepush` na `aaf5c36` |
| Zahrnuté etapy | Stage 0, 1, 2, 3 a 4 a oprava pádu `d36d01f` |
| Nezahrnuté | Stage 5 neexistuje. Nie je implementovaný ani začatý |

Číslo buildu vzniká ako `1000 + číslo behu`, takže sa zvyšuje samo a `app.json` sa nemenil. Identita aplikácie, podpisový tím a verzia 1.0.0 ostali rovnaké. V projekte nie je EAS, build ide cez `rn-testflight.yml`.

## Stav CI

| Beh | Commit | Výsledok |
|---|---|---|
| RN iOS [41434719415](https://github.com/adonistech-sk/Skylens/actions/runs/41434719415) | `c5da24b` | **Zlyhal.** 9 z 10 flowov, pád `SIGABRT` v `09_solar_and_moon` |
| RN iOS [41444899313](https://github.com/adonistech-sk/Skylens/actions/runs/41444899313), pokus 1 | `d36d01f` | **Zlyhal** pri snímaní obrazoviek, flowy sa nespustili |
| RN iOS 41444899313, pokus 2 | `d36d01f` | **Prešiel.** 10 z 10 flowov, 12 obrazoviek, žiadny pád |
| RN TestFlight [41457459840](https://github.com/adonistech-sk/Skylens/actions/runs/41457459840), beh 2 | `d36d01f` | **Prešiel.** Kontrola, archív, nahratie aj distribúcia |
| CI 14 (Swift) | `d36d01f` | Prešiel |

## Stav v TestFlight

Údaje sú prečítané späť z App Store Connect po distribúcii.

| Položka | Stav |
|---|---|
| Spracovanie Apple | `VALID` |
| Interné testovanie | `IN_BETA_TESTING` |
| Externé testovanie | `READY_FOR_BETA_SUBMISSION`, čiže neodoslané na kontrolu |
| Skupiny s buildom | Iba `Internal` |
| Skupina `Internal` | Interná, automatická distribúcia zapnutá, verejný odkaz vypnutý, 2 testeri: `s***@icloud.com`, `p***@workbase.sk` |
| Iné skupiny | Žiadne, ani externé |
| App Store | Verzia 1.0 bola pred buildom v stave `PREPARE_FOR_SUBMISSION`. Workflow nemá ako ju odoslať |

Automatická distribúcia ostala zapnutá. Bezpečná je preto, že skupina je jediná. Každý ďalší build sa k týmto dvom testerom dostane sám. Ak pribudne ďalšia skupina s automatickou distribúciou, kontrola pred nahratím build zastaví.

Neoverené: či testerom prišlo oznámenie a či sa build reálne nainštaluje na iPhone.

## Overenie pred vydaním

| Kontrola | Výsledok na `d36d01f` |
|---|---|
| TypeScript | Bez chýb, lokálne aj v CI |
| Unit a vedecké testy | 306 prešlo, 2 preskočené, lokálne aj v CI |
| Webové flowy Stage 0 až 3 | 56 z 56, s prísnym `drawPoints` ako na iPhone |
| Webové flowy Stage 4 | 17 zo 17 |
| Zachytenia `web-stage2`, `web-stage3`, `web-states` | Bez chýb, spustené na `aaf5c36`, pred opravou |
| Tajné údaje | 396 textových objektov vo všetkých odosielaných commitoch, žiadny nález. 324 binárnych súborov sa nedalo prehľadať obsahovo a kontrola názvov bola čistá |

Testy neboli oslabené. Pribudla jedna prísnejšia kontrola.

Záznamy obrazoviek z iOS sú v [evidence/testflight/](evidence/testflight/). Čísla na nich sú zo simulátora s demo režimom, nie zo zariadenia.

## Čo overenie našlo

- **Pád v Solar System, opravený.** Prelet k Jupiteru zúžil záber, jedna skupina hviezd ostala prázdna a natívna Skia na prázdne pole vyhodí výnimku. Aplikácia spadla. Web Skia prázdne pole prijme, preto všetky webové flowy prešli. Chyba sa zopakovala na webe s rovnakou kontrolou ako na iOS a po oprave zmizla. Táto kontrola je teraz stálou súčasťou `web-flows.mjs`.
- **Prerušované zlyhanie, neopravené.** Odkaz `skylens://onboarding` sa pri prvom spustení nedostal na obrazovku do 20 sekúnd. Je to pravdepodobne známy súbeh pri studenom štarte, príčina však nie je dokázaná, lebo CI ladiace dáta tohto kroku neukladá. Stalo sa to v 1 z 3 behov.
- **Kozmetika, neopravená.** Názov Aldebaran presvitá pod tlačidlami v detaile Oriona. Barnardova hviezda nemá vo výsledkoch hľadania obrázok.

Staršie prerušované zlyhania sa v týchto behoch neobjavili: limit 5 ms v `search-v1` a zatváranie panela. Stále existujú.

## Diagnostika

- **Sky → Layers → On this device:** čas JS snímky, počty hviezd a stav balíka. Funguje v Release buildoch bez prepínača.
- **More → Sky engine:** prepínače na vypnutie nových častí oblohy.

Diagnostika nemeria FPS, pamäť ani GPU a neexistuje pre Solar System ani Moon Atlas. Žiadne natívne merania neboli pridané ani odhadnuté. Hodnoty zo simulátora sú v [PERFORMANCE_RESULTS.md](PERFORMANCE_RESULTS.md).

## Zmeny mimo aplikácie

- `.github/scripts/testflight-asc.mjs` a `rn-testflight-audit.yml`: prehľad App Store Connect. Skript pracuje iba s `sk.skylens.app` a jeho jediný povolený zápis pridáva build do beta skupiny.
- `rn-testflight.yml`: kontrola pred nahratím a distribúcia po spracovaní.
- Premenná repozitára `TESTFLIGHT_INTERNAL_GROUP=Internal`.

Repozitár je verejný, takže aj kód a logy CI sú verejné. E-maily testerov sa v logoch maskujú.

## Čo overil simulátor a čo stále nie

Simulátor potvrdil vykreslenie figúr súhvezdí, planét a Mesiaca, čítanie balíka hviezd, panel, turné a Moon Atlas. Stále bez dôkazu sú kompas, AR kamera, GPS, pinch, nákupy, VoiceOver, plynulosť, pamäť, teplota a batéria. To všetko pokrýva [V1_IPHONE_TEST_CHECKLIST.md](V1_IPHONE_TEST_CHECKLIST.md).

Práva a dáta sa nezmenili. Zdroje v stave HOLD ostávajú nepoužité. Otvorené rozhodnutia v [V1_DECISION_LOG.md](V1_DECISION_LOG.md) platia ďalej a príbehy súhvezdí nie sú fakticky overené celé.

## Ďalší krok

Test na iPhone podľa zoznamu. Stage 5 sa začne až po tvojom pokyne.
