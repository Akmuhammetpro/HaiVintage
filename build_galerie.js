/**
 * build_galerie.js
 * 
 * Rulează cu: node build_galerie.js
 * 
 * Ce face:
 *  1. Citește images.json (galerie.json) și alege aleator N imagini (7-11, ≠ 10)
 *  2. Compilează galerie-animata.scss → resurse/css/galerie-animata.css
 *  3. Scrie resurse/json/galerie-animata.json cu imaginile alese
 *     (folosit de EJS la fiecare request pentru a încărca galeria)
 * 
 * IMPORTANT: Rulează acest script înainte de a porni serverul (sau la fiecare restart).
 * Poți adăuga în package.json:
 *   "scripts": { "build": "node build_galerie.js && node index.js" }
 */

const sass = require('sass');
const fs   = require('fs');
const path = require('path');

// ── 1. Număr aleator 7–11, ≠ 10 ─────────────────────────────────────────────
function numarAleator() {
  let n;
  do { n = Math.floor(Math.random() * 5) + 7; } while (n === 10);
  return n;
}

// ── 2. Alege N imagini distincte aleator din JSON ────────────────────────────
function alegeImagini(sursa, n) {
  const amestecate = [...sursa].sort(() => Math.random() - 0.5);
  return amestecate.slice(0, n);
}

// ── 3. Compilare SASS ────────────────────────────────────────────────────────
function compileazaSass() {
  const sassPath = path.join(__dirname, 'resurse', 'sass', 'galerie-animata.scss');
  const cssPath  = path.join(__dirname, 'resurse', 'css',  'galerie-animata.css');

  if (!fs.existsSync(sassPath)) {
    console.error(' Lipsește fișierul SASS: ' + sassPath);
    process.exit(1);
  }

  const result = sass.compile(sassPath, { style: 'compressed' });
  fs.writeFileSync(cssPath, result.css, 'utf8');
  console.log(`✓  CSS compilat (${result.css.length} bytes) → ${cssPath}`);
}

// ── 4. Generează JSON cu imaginile selectate ─────────────────────────────────
function genereazaJson() {
  const galeriePath = path.join(__dirname, 'resurse', 'json', 'galerie.json');

  if (!fs.existsSync(galeriePath)) {
    console.error(' Lipsește galerie.json: ' + galeriePath);
    process.exit(1);
  }

  const galObj    = JSON.parse(fs.readFileSync(galeriePath, 'utf8'));
  const n         = numarAleator();
  const selectate = alegeImagini(galObj.imagini, n);

  const outPath = path.join(__dirname, 'resurse', 'json', 'galerie-animata.json');
  fs.writeFileSync(outPath, JSON.stringify({
    cale_galerie: galObj.cale_galerie,
    numar: n,
    imagini: selectate
  }, null, 2), 'utf8');

  console.log(`Galerie animată: ${n} imagini selectate → ${outPath}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
try {
  compileazaSass();
  genereazaJson();
  console.log(' Build complet!');
} catch (err) {
  console.error('Eroare build:', err.message);
  process.exit(1);
}