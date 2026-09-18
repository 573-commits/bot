// Registr témat. Přidat téma = vytvořit soubor v js/topics/ a přidat ho do tohoto seznamu.
import linearniRovnice from './linearni-rovnice.js';
import kvadratickeRovnice from './kvadraticke-rovnice.js';
import soustavyRovnic from './soustavy-rovnic.js';
import zlomky from './zlomky.js';
import procenta from './procenta.js';
import mocninyOdmocniny from './mocniny-odmocniny.js';
import vyrazy from './vyrazy.js';
import nerovnice from './nerovnice.js';
import mnoziny from './mnoziny.js';
import linearniFunkce from './linearni-funkce.js';
import logaritmy from './logaritmy.js';
import goniometrie from './goniometrie.js';
import limity from './limity.js';
import derivace from './derivace.js';
import integraly from './integraly.js';
import optimalizace from './optimalizace.js';
import posloupnosti from './posloupnosti.js';
import kombinatorika from './kombinatorika.js';
import pravdepodobnost from './pravdepodobnost.js';
import statistika from './statistika.js';
import regrese from './regrese.js';
import financniMatematika from './financni-matematika.js';
import matice from './matice.js';
import vektory from './vektory.js';
import absolutniHodnota from './absolutni-hodnota.js';
import komplexniCisla from './komplexni-cisla.js';
import polynomy from './polynomy.js';
import parcialniDerivace from './parcialni-derivace.js';
import normalniRozdeleni from './normalni-rozdeleni.js';
import binomickeRozdeleni from './binomicke-rozdeleni.js';
import intervalySpolehlivosti from './intervaly-spolehlivosti.js';
import testovaniHypotez from './testovani-hypotez.js';
import casoveRady from './casove-rady.js';
import elasticita from './elasticita.js';
import linearniProgramovani from './linearni-programovani.js';
import analytickaGeometrie from './analyticka-geometrie.js';

export const TOPICS = [
  zlomky, procenta, mocninyOdmocniny, mnoziny,
  linearniRovnice, kvadratickeRovnice, soustavyRovnic, vyrazy, nerovnice,
  absolutniHodnota, polynomy, komplexniCisla,
  linearniFunkce, logaritmy, goniometrie,
  limity, derivace, integraly, optimalizace, parcialniDerivace,
  posloupnosti, kombinatorika, pravdepodobnost,
  statistika, regrese, normalniRozdeleni, binomickeRozdeleni,
  intervalySpolehlivosti, testovaniHypotez,
  financniMatematika, casoveRady, elasticita, linearniProgramovani,
  matice, vektory, analytickaGeometrie,
];

/** Pořadí kategorií v přehledu. */
export const CATEGORIES = [
  'Základy', 'Algebra', 'Funkce', 'Analýza',
  'Diskrétní matematika', 'Data', 'Business',
  'Lineární algebra', 'Geometrie',
];

export const byId = (id) => TOPICS.find((t) => t.id === id);
