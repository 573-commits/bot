# Jak přidat nové téma

Téma = jeden soubor v `js/topics/`, který umí vygenerovat úlohu pro danou úroveň.
Žádný build, žádná instalace. Stačí soubor přidat a zaregistrovat.

## 1. Vytvoř soubor

`js/topics/moje-tema.js`:

```js
import { fmt, sgn, coef, polyTex } from '../core/util.js';

export default {
  id: 'moje-tema',            // musí být unikátní, používá se jako klíč postupu
  name: 'Moje téma',          // zobrazený název
  category: 'Algebra',        // musí být jedna z CATEGORIES v index.js
  icon: '∆',                  // krátký znak nebo emoji
  description: 'Jedna věta, co se tu procvičuje.',
  levels: 4,                  // počet úrovní obtížnosti

  /**
   * @param {number} level  1..levels
   * @param {Function} rng  generátor náhody (viz níže)
   */
  generate(level, rng) {
    const a = rng.int(2, 9);
    const x = rng.int(-5, 5);
    return {
      prompt: `Vyřeš rovnici:\n$$${coef(a)} = ${a * x}$$`,
      answer: { type: 'number', value: x },
      answerLabel: 'x =',
      placeholder: 'např. 3',
      hints: [
        'Vyděl obě strany číslem u x.',
        `Tedy $x = \\frac{${a * x}}{${a}}$.`,
      ],
      solution: [
        `$${coef(a)} = ${a * x}$`,
        `$x = ${fmt(x)}$`,
      ],
      viz: null,   // nepovinné, viz sekce Vizualizace
    };
  },
};
```

## 2. Zaregistruj ho

V `js/topics/index.js` přidej import a zařaď do seznamu `TOPICS`:

```js
import mojeTema from './moje-tema.js';

export const TOPICS = [
  /* … */,
  mojeTema,
];
```

Když používáš novou kategorii, přidej ji i do `CATEGORIES` (určuje pořadí v přehledu).

Hotovo. Po obnovení stránky se téma objeví.

---

## Generátor náhody (`rng`)

Je seedovatelný, takže je vše reprodukovatelné.

| Volání | Co dělá |
|---|---|
| `rng()` | číslo 0–1 |
| `rng.int(a, b)` | celé číslo včetně obou mezí |
| `rng.nz(a, b)` | celé číslo, nikdy 0 |
| `rng.pick(pole)` | náhodný prvek |
| `rng.sample(pole, n)` | n různých prvků |
| `rng.shuffle(pole)` | zamíchaná kopie |
| `rng.sign()` | `1` nebo `-1` |

---

## Typy odpovědí (`answer.type`)

| Typ | Hodnota | Co uživatel píše |
|---|---|---|
| `number` | číslo | `1,5`, `3/4`, `sqrt(2)/2`, `2^3` |
| `integer` | celé číslo | `42` |
| `numberSet` | pole čísel, **na pořadí nezáleží** | `2; 3` |
| `numberList` | pole čísel, **pořadí rozhoduje** | `3; -2` |
| `fraction` | číselná hodnota zlomku | `3/4` |
| `text` | řetězec nebo pole přijatelných variant | `(2;inf)` |
| `custom` | vlastní `validate(vstup)` vracející `{ok, message?}` | cokoli |

Přesnost:

- `tol: 0.001` – absolutní tolerance
- `decimals: 2` – uživatel má zaokrouhlit na 2 místa (tolerance se dopočítá)
- bez obojího – relativní tolerance 1e-6

Volitelné `display: '\\frac{3}{4}'` určí, jak se správná odpověď ukáže po chybě.

---

## Zadání a postup (`prompt`, `hints`, `solution`)

Podporují mini-markdown a LaTeX:

- `**tučně**`, `*kurzíva*`, `` `kód` ``, odřádkování `\n`
- `$inline vzorec$` a `$$vzorec na řádku$$`

`hints` je pole – odhalují se postupně po kliknutí. Piš je od nejobecnější
(„co použít“) po nejkonkrétnější („dosazená čísla“), nikdy tam nedávej rovnou výsledek.

`solution` je pole kroků, zobrazí se jako číslovaný postup.

---

## Vizualizace (`viz`)

| `type` | Klíčové vlastnosti |
|---|---|
| `function` | `fns: [{f, label, color, dashed}]`, `xRange`, `yRange`, `points`, `hlines`, `vlines`, `area: {f, g, from, to}` |
| `numberline` | `range: [a,b]`, `intervals: [{from,to,openL,openR,label}]`, `points: [{x,open,label}]` |
| `bars` | `data: [{label, value, color}]`, `lines: [{value,label}]` |
| `scatter` | `points: [{x,y,label}]`, `line: {a, b, label}` |
| `venn` | `shade: 'A∩B' | 'A∪B' | 'A\\B' | 'B\\A' | 'A' | 'B'`, `labelA`, `labelB`, `texts` |
| `unitcircle` | `angle` (ve stupních), `angleLabel`, `showProjections` |
| `triangle` | `vertices: [{x,y}×3]`, `labels`, `rightAngleAt` |
| `svg` | `svg: '<svg…>'` – vlastní SVG, když nic z výše uvedeného nesedí |

Příklad – parabola s vyznačenými kořeny:

```js
viz: {
  type: 'function',
  xRange: [-5, 5],
  fns: [{ f: (x) => x * x - 4, label: 'y = x² − 4' }],
  points: [{ x: -2, y: 0 }, { x: 2, y: 0 }],
}
```

Barvy se berou z CSS proměnných (`--c1`…`--c5`), takže vizualizace automaticky
sedí i v tmavém režimu.

---

## Užitečné funkce z `core/util.js`

```js
fmt(x, d)            // číslo na výstup, ořízne plovoucí smetí
fracTex(n, d)        // LaTeX zlomek v základním tvaru
simplify(n, d)       // [čitatel, jmenovatel] po zkrácení
coef(c, 'x')         // 1x → "x", -1x → "-x", 0x → ""
sgn(x)               // "+3" / "-3" pro skládání výrazů
polyTex([a,b,c])     // "ax^{2} + bx + c"
gcd, lcm, factorial, nCr, nPr
mean, median, variance, stdev
round, clamp, isInt
```

---

## Doporučení k obtížnosti

Úrovně 1–5 jsou **v rámci tématu**, ne napříč appkou:

1. jeden krok, celá čísla, výsledek vyjde hezky
2. dva kroky nebo záporná čísla
3. zlomky, závorky, potřeba úpravy
4. kombinace více pravidel, zaokrouhlování
5. slovní úloha nebo netypické zadání

Snaž se, aby na úrovních 1–3 výsledky vycházely hezky – úlohu stavěj **od výsledku**
(zvol kořen a dopočítej koeficienty), ne naopak.

---

## Kontrola, že téma funguje

```bash
node --input-type=module -e "
(async()=>{const {makeRng}=await import('./js/core/util.js');
const t=(await import('./js/topics/moje-tema.js')).default;
for(let L=1;L<=t.levels;L++)for(let s=0;s<10;s++){
  const q=t.generate(L,makeRng(s*7+L));
  console.log('L'+L, q.prompt.replace(/\n/g,' ').slice(0,70), '→', JSON.stringify(q.answer.value));
}})()"
```
