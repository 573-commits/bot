# 🏋️ Matematická posilovna

Osobní webová posilovna na matematiku – běží v prohlížeči na notebooku i na mobilu,
bez serveru, bez účtu, bez instalace.

**Co umí**

- **36 témat** od zlomků po derivace, testování hypotéz a lineární programování
- **generované úlohy** – nikdy nedojdou a neopakují se dokola
- **nápovědy po krocích** a kompletní **postup řešení**, když nevíš
- **vizualizace** – grafy funkcí, číselná osa, Vennovy diagramy, jednotková kružnice, bodové grafy, Gaussova křivka, množina přípustných řešení
- **adaptivní obtížnost** – každé téma má vlastní úroveň 1–5, která se hýbe podle toho, jak ti to jde
- **rozložené opakování** – appka sama hlídá, kdy se k tématu vrátit, než ho začneš zapomínat
- **sledování postupu** – co ti jde, co ne, kolik jsi toho odcvičil, kolik dní v řadě
- **režim „slabá místa“** – appka sama vybírá témata, kde nejvíc plaveš
- **claymorphism vzhled**, světlý i tmavý režim
- **synchronizace mezi zařízeními** – stejný postup na notebooku i na mobilu
- funguje **offline** (PWA) a jde ji přidat na plochu telefonu

### Co se dá procvičovat

| Okruh | Témata |
|---|---|
| Základy | zlomky, procenta, mocniny a odmocniny, množiny |
| Algebra | lineární a kvadratické rovnice, soustavy, úpravy výrazů, nerovnice, absolutní hodnota, polynomy, komplexní čísla |
| Funkce | lineární funkce, logaritmy a exponenciály, goniometrie |
| Analýza | limity, derivace, integrály, optimalizace, parciální derivace |
| Diskrétní matematika | posloupnosti a řady, kombinatorika, pravděpodobnost |
| Data | popisná statistika, regrese a korelace, normální rozdělení, binomické rozdělení, intervaly spolehlivosti, testování hypotéz |
| Business | finanční matematika, časové řady a indexy, elasticita poptávky, lineární programování |
| Lineární algebra | matice a determinanty, vektory |
| Geometrie | analytická geometrie |

---

## Jak to spustit

### Varianta A – GitHub Pages (doporučeno)

Jednou nastavit: **Settings → Pages → Source: GitHub Actions**. Pak už se appka
při každém pushi nasadí sama a je na
<https://573-commits.github.io/bot/> – tuhle adresu si otevři na mobilu
a v prohlížeči zvol *Přidat na plochu*.

Workflow se spouští z výchozí větve repozitáře (`.github/workflows/pages.yml`);
když větev přejmenuješ, uprav i seznam větví v `on: push:`.

### Varianta B – lokálně

```bash
python3 -m http.server 8000
# a otevři http://localhost:8000
```

(Jakýkoli statický server stačí. Přímé otevření `index.html` z disku
nefunguje, protože prohlížeč blokuje ES moduly na `file://`.)

---

## Jak se to ovládá

| Obrazovka | K čemu je |
|---|---|
| **Domů** | dnešní statistika, rychlý start, přehled slabých a silných míst |
| **Témata** | výběr témat do tréninku, filtr podle kategorie, „trénovat jen tohle“ |
| **Trénink** | samotné úlohy, nápovědy, postup, vizualizace; odznak ukazuje, kolik témat je k opakování |
| **Postup** | statistiky podle témat, posledních 14 dní, plán opakování, synchronizace, export/import/reset dat |

**Zápis odpovědí**

| Chceš napsat | Napiš |
|---|---|
| desetinné číslo | `1,5` nebo `1.5` |
| zlomek | `3/4` |
| odmocninu | `sqrt(2)` nebo `sqrt(2)/2` |
| mocninu | `2^5` |
| konstanty | `pi`, `e` |
| funkce | `ln(x)`, `log(x)`, `sin(x)`, `abs(x)` |
| víc výsledků | `2; 3` |
| interval | `(2;inf)`, `<-3;5)`, `(-inf;4>` |
| sjednocení intervalů | `(-inf;1) u (4;inf)` |

**Klávesnice:** <kbd>Enter</kbd> zkontroluje odpověď, druhý <kbd>Enter</kbd> pustí další úlohu.

---

## Jak funguje rozložené opakování

Co jednou zvládneš, ti appka sama vrátí – nejdřív za den, pak za tři, pak za
týden a dál. Čím líp ti téma jde, tím delší pauzy; když propadneš, vrátí se
hned zítra. Termíny hlídá varianta algoritmu SM-2 počítaná ne z jednotlivých
příkladů, ale z celých cvičebních sezení.

Na *Domů* najdeš frontu *Dnes k opakování*, tlačítko **Opakovat** ji projede
(3 příklady na téma, témata se střídají) a v *Postupu* je výhled na 30 dní.
Podrobnosti i to, kde se algoritmus dá doladit, jsou v
**[docs/OPAKOVANI.md](docs/OPAKOVANI.md)**.

## Jak funguje adaptivní obtížnost

Každé téma má vlastní úroveň (1 = nejlehčí). Postup se počítá zvlášť pro každé téma.

- **3 správné odpovědi v řadě bez nápovědy** → úroveň o stupeň nahoru
- **2 chyby v řadě** → úroveň o stupeň dolů
- **Zvládnutí tématu (0–100 %)** kombinuje dosaženou úroveň, úspěšnost z posledních
  20 pokusů a to, kolik toho máš odcvičeno – aby se pár šťastných trefů netvářilo jako mistrovství
- Režim **slabá místa** losuje témata s vahou podle toho, jak nízké mají zvládnutí
  a jak dlouho jsi je neprocvičoval
- Tlačítko **Začít trénink** míchá obojí: většinou sáhne po tom, co je na řadě
  k opakování, zbytek času po slabých místech

---

## Kde jsou data a jak se synchronizují

Postup se ukládá do `localStorage` prohlížeče pod klíčem `mathgym.v2`, a to jako
**seznam událostí** – každý vyřešený příklad je samostatný záznam s vlastním
identifikátorem. Statistiky i úroveň v každém tématu se z těch záznamů dopočítávají.

Díky tomu je propojení dvou zařízení jen sjednocení množin: **postup se slučuje,
nepřepisuje**. Můžeš cvičit offline na mobilu i na notebooku a po připojení se
obojí sečte. Opakovaná synchronizace nikdy nic nezdvojí.

Přenos zajišťuje **soukromý GitHub Gist** – žádný vlastní server, žádná další
registrace. Nastavení zabere asi dvě minuty a je popsané v
**[docs/SYNCHRONIZACE.md](docs/SYNCHRONIZACE.md)**; ve zkratce: vygeneruješ
fine-grained token s právem *Gists: Read and write* a vložíš ho v *Postup →
Synchronizace* na obou zařízeních.

Bez tokenu to jde taky – *Stáhnout zálohu* / *Načíst zálohu* udělá totéž ručně.

---

## Přidání nového tématu

Napiš mi, co potřebuješ přidat, a přidám to – nic se nepřeinstalovává, jen přibude
jeden soubor. Když si to budeš chtít udělat sám, celý postup je v
**[docs/PRIDAVANI-TEMAT.md](docs/PRIDAVANI-TEMAT.md)**.

Ve zkratce: nový soubor v `js/topics/`, jeden řádek `import` a jeden záznam v seznamu
v `js/topics/index.js`. Žádný build, žádné závislosti.

---

## Struktura projektu

```
index.html                 kostra stránky
css/clay.css               claymorphism vzhled (světlý + tmavý režim)
js/app.js                  obrazovky, router, ovládání
js/core/
  util.js                  náhoda, zlomky, formátování, statistické funkce
  expr.js                  parser odpovědí (zlomky, sqrt, pi, mocniny…)
  checker.js               vyhodnocení odpovědi podle typu
  plot.js                  vizualizace → inline SVG
  store.js                 event log postupu, odvozené statistiky, slučování
  sync.js                  synchronizace přes soukromý GitHub Gist
  adaptive.js              pravidla úrovní, rozložené opakování, výběr témat
  mathrender.js            mini-markdown + LaTeX (KaTeX, s textovým záložním režimem)
js/topics/
  index.js                 registr témat  ← sem se přidává nové téma
  *.js                     jednotlivá témata
sw.js, manifest.webmanifest  offline režim a instalace na plochu
```

## Kontrolní skripty

```bash
node tools/check-topics.mjs     # vygeneruje úlohy ze všech témat a ověří je
node tools/check-sync.mjs       # ověří slučování postupu a migraci dat
node tools/check-review.mjs     # ověří plánování opakování
node tools/check-css.mjs        # hlídá strukturu stylů (zanoření, duplicity)
```

## Použité knihovny

Jediná externí věc je **KaTeX** z CDN na sázení vzorců (a font Nunito).
Když nejsou k dispozici, appka běží dál – vzorce se jen zobrazí textově.
