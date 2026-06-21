

const sass = require('sass');
const fs = require('fs');
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
  const cssPath = path.join(__dirname, 'resurse', 'css', 'galerie-animata.css');

  if (!fs.existsSync(sassPath)) {
    console.error(' Lipsește fișierul SASS: ' + sassPath);
    process.exit(1);
  }

  const result = sass.compile(sassPath, { style: 'compressed' });
  fs.writeFileSync(cssPath, result.css, 'utf8');
  console.log(`CSS compilat (${result.css.length} bytes) → ${cssPath}`);
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