/**
 * Classe les racines d'un ou plusieurs fichiers AFB120 par segment BNG Connect.
 *
 * Le fichier AFB120 ne porte pas la rubrique comptable : le script en extrait les racines
 * (positions 3 à 8 du numéro de compte de l'enregistrement 01), interroge T24 pour chacune,
 * et classe d'après le libellé NCG des comptes.
 *
 *   node racines-par-segment.js 20260909-116.dat
 *   node racines-par-segment.js *.dat --url https://192.168.1.113/envTest//t24/user-info
 *   node racines-par-segment.js 20260909-116.dat --csv racines.csv
 */
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const args = process.argv.slice(2);
const opt = (nom, defaut) => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : defaut;
};
const URL_T24 = opt('--url', 'https://192.168.1.113/envTest//t24/user-info');
const SORTIE_CSV = opt('--csv', null);
const PAUSE_MS = Number(opt('--pause', 150));
const DEBUG = args.includes('--debug');
let premiereErreur = null;
const fichiers = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--url' && args[i - 1] !== '--csv' && args[i - 1] !== '--pause');

if (!fichiers.length) {
  console.error('Usage : node racines-par-segment.js <fichier.dat> [autres.dat] [--url <url>] [--csv <sortie.csv>] [--pause <ms>]');
  process.exit(1);
}

// --- 1. Racines présentes dans les fichiers ------------------------------------
const comptesParRacine = new Map(); // racine -> Set(numéro de compte)
for (const chemin of fichiers) {
  let contenu;
  try {
    contenu = fs.readFileSync(chemin, 'latin1');
  } catch (e) {
    console.error(`Fichier illisible : ${chemin} (${e.message})`);
    continue;
  }
  contenu.split(/\r?\n/).forEach((ligne) => {
    if (ligne.slice(0, 2) !== '01' || ligne.length < 32) return;
    const compte = ligne.slice(21, 32).replace(/\*/g, ' ').trim();
    const racine = compte.slice(2, 8);
    if (!/^\d{6}$/.test(racine)) return;
    if (!comptesParRacine.has(racine)) comptesParRacine.set(racine, new Set());
    comptesParRacine.get(racine).add(compte);
  });
}

const racines = [...comptesParRacine.keys()].sort();
console.log(`\n${fichiers.length} fichier(s) — ${racines.length} racine(s) distincte(s)\n`);

// --- 2. Classement d'après la rubrique NCG -------------------------------------
const NEUTRES = /\b(EPARGNES?|EPARGES?|DEPOTS?|TERME|DEVISES?|BLOQUES?|ORDINAIRES?)\b/;
const REGLES = [
  [/\b(SOCIETES?|SARLU?|SUARL|SASU?|SAS|SCI|GIE|SA)\b/, 'SOCIETE'],
  [/\b(INDIVIDUELLES?|INDIVIDUELS?|INDIV|IINIDV|INIDV|INDV|PROFESSIONS?|PROFESSIONNELS?|LIBERALES?|LIBERAUX|ENTREPRENANTS?|ETS)\b/, 'ENTREPRISE_INDIVIDUELLE'],
  [/\b(ENTREPRISES?|ENTRPRISES?|ENTEPRISES?|CORPORATE|PME|COMMERCES?)\b/, 'SOCIETE'],
  [/\b(PARTICULIERS?|PRIVES?|PERSONNELS?|MENAGES?|SALARIES?)\b/, 'PARTICULIER'],
];
const normaliser = (v) =>
  String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();

function classer(libelles) {
  const utiles = libelles.filter((l) => l && !NEUTRES.test(normaliser(l)));
  const trouves = new Set();
  for (const lib of utiles) {
    const texte = normaliser(lib);
    for (const [re, seg] of REGLES) {
      if (re.test(texte)) { trouves.add(seg); break; }
    }
  }
  if (trouves.size > 1) return 'MIXTE';
  return [...trouves][0] || 'INDETERMINE';
}

// --- 3. Interrogation T24 -------------------------------------------------------
function noterErreur(racine, raison) {
  if (!premiereErreur) premiereErreur = { racine, raison };
  if (DEBUG) console.log(`\n  [debug] ${racine} : ${raison}`);
}

function appelerT24(racine) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(URL_T24);
    } catch (e) {
      noterErreur(racine, `URL invalide « ${URL_T24} » (${e.message})`);
      return resolve(null);
    }
    const payload = JSON.stringify({ racine });
    const client = url.protocol === 'http:' ? http : https;
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'http:' ? 80 : 443),
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        rejectUnauthorized: false,
        timeout: 20000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const corps = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const extrait = corps.replace(/\s+/g, ' ').slice(0, 180);
            noterErreur(racine, `HTTP ${res.statusCode} — ${extrait}`);
            return resolve(null);
          }
          let json;
          try {
            json = JSON.parse(corps);
          } catch {
            noterErreur(racine, `réponse non JSON — ${corps.replace(/\s+/g, ' ').slice(0, 180)}`);
            return resolve(null);
          }
          const rec = json && json.data && json.data.data && json.data.data[0];
          if (!rec) {
            noterErreur(racine, `aucun client dans la réponse (statut ${json && json.statut}, ${json && json.statutMsg})`);
            return resolve(null);
          }
          resolve(rec);
        });
      }
    );
    req.on('timeout', () => { req.destroy(); noterErreur(racine, 'délai dépassé (20 s)'); resolve(null); });
    req.on('error', (e) => { noterErreur(racine, `${e.code || ''} ${e.message}`.trim()); resolve(null); });
    req.write(payload);
    req.end();
  });
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const resultats = [];
  for (let i = 0; i < racines.length; i++) {
    const racine = racines[i];
    process.stdout.write(`\r  interrogation T24 ${i + 1}/${racines.length}   `);
    const rec = await appelerT24(racine);
    const comptesT24 = Array.isArray(rec && rec.comptes) ? rec.comptes : [];
    const libelles = comptesT24.map((c) => (c && c.libncg) || '');
    resultats.push({
      racine,
      nom: (rec && rec.nomPrenom) || '(inconnu de T24)',
      segment: rec ? classer(libelles) : 'T24_INJOIGNABLE',
      rubriques: [...new Set(libelles)].join(' | '),
      comptesFichier: [...comptesParRacine.get(racine)].join(' '),
      comptesT24: comptesT24.map((c) => c.compte).join(' '),
    });
    if (PAUSE_MS) await attendre(PAUSE_MS);
  }
  process.stdout.write('\r' + ' '.repeat(40) + '\r');

  if (premiereErreur) {
    console.log(`\nURL interrogée : ${URL_T24}`);
    console.log(`Première erreur (racine ${premiereErreur.racine}) : ${premiereErreur.raison}`);
    console.log('Relancez avec --debug pour voir toutes les erreurs, ou --url pour corriger l\'adresse.\n');
  }

  const ordre = ['ENTREPRISE_INDIVIDUELLE', 'SOCIETE', 'PARTICULIER', 'MIXTE', 'INDETERMINE', 'T24_INJOIGNABLE'];
  for (const seg of ordre) {
    const lot = resultats.filter((r) => r.segment === seg);
    if (!lot.length) continue;
    console.log(`\n### ${seg}  (${lot.length})`);
    for (const r of lot) {
      console.log(`  ${r.racine}  ${r.nom.padEnd(38).slice(0, 38)}  ${r.rubriques}`);
    }
  }

  console.log('\n--- récapitulatif ---');
  for (const seg of ordre) {
    const n = resultats.filter((r) => r.segment === seg).length;
    if (n) console.log(`  ${seg.padEnd(24)} ${n}`);
  }

  if (SORTIE_CSV) {
    const ech = (v) => (/[";\r\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const lignes = [['racine', 'nom', 'segment', 'rubriques_ncg', 'comptes_fichier', 'comptes_t24'].join(';')];
    resultats.forEach((r) =>
      lignes.push([r.racine, r.nom, r.segment, r.rubriques, r.comptesFichier, r.comptesT24].map(ech).join(';'))
    );
    fs.writeFileSync(SORTIE_CSV, '﻿' + lignes.join('\r\n') + '\r\n', 'utf8');
    console.log(`\nCSV écrit : ${SORTIE_CSV}`);
  }
})();
