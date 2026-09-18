# Synchronizace mezi zařízeními

Aby byl postup stejný na počítači i na mobilu.

## Jak to funguje

Aplikace nemá server. Data se ukládají do **soukromého GitHub Gistu** – to je
v podstatě privátní schránka na textový soubor, kterou má každý účet na GitHubu
zdarma. Appka si tam po každých pár příkladech uloží aktuální stav a při spuštění
si ho zase stáhne.

Důležité je, že se postup **slučuje, ne přepisuje**:

- Každý vyřešený příklad je samostatný záznam s vlastním identifikátorem.
- Sloučení dvou zařízení = sjednocení těch záznamů podle identifikátoru.
- Proto je jedno, v jakém pořadí se co synchronizuje. Můžeš týden cvičit offline
  v metru na mobilu a mezitím i na notebooku – po připojení se **obojí sečte**
  a nic se neztratí.
- Opakovaná synchronizace nikdy nic nezdvojí.
- Úroveň v každém tématu se nedrží jako číslo, ale **dopočítává se** z historie
  odpovědí. Po sloučení tedy vyjde stejná hodnota všude.

## Nastavení (jednou, ~2 minuty)

1. Otevři <https://github.com/settings/personal-access-tokens/new>
2. **Token name** – cokoli, třeba `matematicka-posilovna`
3. **Expiration** – dej co nejdelší. Až token vyprší, synchronizace přestane
   fungovat a budeš muset vygenerovat nový (data se neztratí, jen se přestanou
   přenášet).
4. **Repository access** nech na *Public repositories* – appka repozitáře nepotřebuje.
5. V **Account permissions** najdi **Gists** a přepni na **Read and write**.
   Nic jiného nepovoluj.
6. **Generate token**, zkopíruj ho (ukáže se jen jednou).
7. V aplikaci: **Postup → Synchronizace → vlož token → Propojit**.

Na druhém zařízení uděláš krok 7 se **stejným tokenem**. Appka si sama najde
existující zálohu a data sloučí.

## Kdy se synchronizuje

- při spuštění aplikace
- když se k appce vrátíš z jiné karty nebo aplikace
- po pár vyřešených příkladech (s malým zpožděním, aby se nevolalo API pořád)
- při zavření nebo odložení aplikace
- kdykoli ručně tlačítkem **Synchronizovat teď**

Ikona v hlavičce ukazuje stav:

| Ikona | Význam |
|---|---|
| ✓ | vše synchronizováno |
| ↻ | právě probíhá |
| ⌁ | offline – uloženo v zařízení, pošle se po připojení |
| ⚠ | chyba (nejčastěji vypršelý token) |

## Bezpečnost

- Token zůstává uložený **v prohlížeči daného zařízení**, aby se appka mohla
  synchronizovat sama. Nezadávej ho na cizím počítači.
- Token má povolené **jen gisty**, k repozitářům se přes něj nikdo nedostane.
- Gist je **soukromý** – ve vyhledávání ani na profilu se neukáže.
- Kdykoli můžeš token zneplatnit v <https://github.com/settings/tokens?type=beta>.
  Tím se synchronizace zastaví, ale odcvičený postup v zařízeních zůstane.
- V exportované záloze ani v gistu token není.

## Časté situace

**Nechci token.** Použij **Postup → Stáhnout zálohu** a na druhém zařízení
**Načíst zálohu**. Data se taky sloučí, jen to musíš udělat ručně.

**Vymazal jsem postup na jednom zařízení.** Prázdný stav se na ostatní zařízení
nepropíše – sloučení umí jen přidávat. Při další synchronizaci se ti data zase
stáhnou zpátky. Když chceš smazat opravdu všude, nejdřív se odpoj, pak smaž
a nakonec smaž i gist na GitHubu.

**Token vypršel.** Ikona ukáže ⚠. Vygeneruj nový token a vlož ho znovu – appka
si najde ten samý gist a naváže.

**Cvičím na dvou zařízeních zároveň.** Nevadí. Obě nahrají svoje záznamy
a po dalším kole se srovnají.

## Kde ta data vlastně leží

V gistu se souborem `matematicka-posilovna.json` a popisem obsahujícím
`mathgym-sync-v1`. Najdeš ho na <https://gist.github.com/> mezi svými
tajnými gisty. Je to obyčejný JSON – klidně si ho prohlédni.
