# Rozložené opakování (spaced repetition)

Nejde jen o to úlohu jednou vyřešit, ale mít ji v hlavě i za měsíc. Aplikace
proto sama hlídá, kdy se k tématu vrátit – **těsně předtím, než bys ho začal
zapomínat**. Tehdy má opakování největší efekt a stojí nejmíň času.

## Jak se počítá termín

Použitá je varianta algoritmu **SM-2** (ten, na kterém stojí Anki), upravená
pro to, že tady nejsou pevné kartičky, ale generované příklady.

**Jednotkou není příklad, ale sezení.** Všechno, co v jednom tématu vyřešíš
během půl hodiny, se počítá jako jedno sezení. Z něj se spočítá známka 0–5:

- základ je úspěšnost v sezení
- za použité nápovědy se známka snižuje (plná nápověda ubere až čtvrtinu)

Podle známky se posune interval:

| Situace | Co se stane |
|---|---|
| známka < 3 (propadl) | téma se vrátí **na zítřek**, počítadlo opakování se nuluje |
| 1. úspěšné opakování | za **1 den** |
| 2. úspěšné opakování | za **3 dny** |
| další | předchozí interval × koeficient snadnosti |

Koeficient snadnosti (*ease*) začíná na 2,3 a pohybuje se mezi 1,3 a 2,8 –
roste, když ti téma jde, klesá při chybách. Interval je stropovaný na 120 dní.

Typická řada u bezchybného postupu: **1 → 3 → 8 → 21 → 55 dní**.

### Proč se krátká sezení počítají méně

Kdyby jediný správně vyřešený příklad posunul téma o měsíc, stačilo by mít
štěstí. Proto se síla posunu váží délkou sezení: plný účinek má sezení
o čtyřech a více příkladech, jediný příklad plánem jen pohne.

## Jak se to projeví v aplikaci

- **Domů** – karta *Dnes k opakování* se seznamem témat po termínu
  (nejzpožděnější nahoře) a tlačítkem, které je projede všechna.
- **Odznak u Tréninku** v navigaci ukazuje, kolik témat čeká.
- **Začít trénink** upřednostňuje témata po termínu (zhruba ze tří čtvrtin),
  zbytek času sáhne po slabých a dlouho nedotčených.
- **Opakovat** je přísný režim: jede jen frontu, **3 příklady na téma**,
  a témata při tom střídá – prostřídané opakování drží líp než odbavit jedno
  téma po druhém. Na konci ukáže shrnutí s novými termíny.
- **Postup → Plán opakování** má výhled na 30 dní dopředu.
- U každého tématu je vidět, kdy přijde na řadu (*opakovat za 3 dny*,
  *po termínu o 6 d*).

Fronta opakování se řídí plánem, **ne** aktuálním výběrem témat – jinak by
sis mohl filtrem nechtěně zamést pod koberec zrovna to, co začínáš zapomínat.

## Jak to drží pohromadě se synchronizací

Plán opakování se nikam neukládá jako stav – **dopočítává se z historie
odpovědí** (stejně jako úroveň v tématu). Když tedy sloučíš postup z mobilu
a z notebooku, přehrají se všechny záznamy dohromady a termín vyjde stejně na
obou zařízeních. Sezení odcvičené na dvou zařízeních se nezdvojí.

## Kde se to dá doladit

V `js/core/adaptive.js`:

```js
export const SESSION_GAP_MS = 30 * 60 * 1000;  // delší pauza = nové sezení
export const START_EASE = 2.3;                 // výchozí snadnost
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const MAX_INTERVAL_DAYS = 120;          // strop intervalu
export const DUE_SHARE = 0.75;                 // podíl opakování v běžném tréninku
```

A v `js/app.js`:

```js
const REVIEW_PER_TOPIC = 3;   // kolik příkladů na téma v režimu opakování
```

Po změně stačí obnovit stránku – protože je plán odvozený, **přepočítá se
zpětně z celé historie**, ne až od nových odpovědí.

## Kontrola

```bash
node tools/check-review.mjs
```

Ověřuje růst intervalů, návrat na zítřek po propadnutí, vliv nápověd, to že
malá sezení neodpálí termín na měsíc, správné rozpoznání fronty a výhledu
a nezávislost plánu na pořadí slučování dat.
