const dotenv = require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sass = require('sass');
const pool = require('./db/config');
const app = express();
const port = 8080;

console.log("Director:", __dirname);
console.log("Fisier:", __filename);
console.log("Work process director:", process.cwd());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
vect_foldere.forEach(folder => {
    let dir = path.join(__dirname, folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

let obGlobal = {
    obErori: null,
    folderScss: path.join(__dirname, 'resurse', 'sass'),
    folderCss: path.join(__dirname, 'resurse', 'css')
};

function compileazaScss(caleScss, caleCss) {
    // Dacă caleScss e relativă, o facem absolută față de folderScss
    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(obGlobal.folderScss, caleScss);
    }

    // Dacă caleCss lipsește sau e relativă
    if (!caleCss) {
        // Folosim același nume dar cu extensia .css
        let numeFisier = path.basename(caleScss, '.scss') + '.css';
        caleCss = path.join(obGlobal.folderCss, numeFisier);
    } else if (!path.isAbsolute(caleCss)) {
        caleCss = path.join(obGlobal.folderCss, caleCss);
    }

    // TASK C: Backup al fișierului css vechi înainte de suprascriere
    if (fs.existsSync(caleCss)) {
        try {
            let backupDir = path.join(__dirname, 'backup', 'resurse', 'css');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            let numeCss = path.basename(caleCss);
            let backupCale = path.join(backupDir, numeCss);
            fs.copyFileSync(caleCss, backupCale);
            console.log(`Backup realizat: ${backupCale}`);
        } catch (err) {
            console.error(`Eroare la backup pentru ${caleCss}:`, err);
        }
    }

    // COMPILARE efectivă
    try {
        let rezultat = sass.compile(caleScss, { style: 'expanded' });
        fs.writeFileSync(caleCss, rezultat.css, 'utf8');
        console.log(`Compilat: ${caleScss} → ${caleCss}`);
    } catch (err) {
        console.error(`Eroare compilare SCSS (${caleScss}):`, err.message);
    }
}


function compileazaToateScss() {
    if (!fs.existsSync(obGlobal.folderScss)) {
        console.log("Folderul SCSS nu există:", obGlobal.folderScss);
        return;
    }
    let fisiere = fs.readdirSync(obGlobal.folderScss);
    fisiere.forEach(fisier => {
        if (fisier.endsWith('.scss')) {
            let caleScss = path.join(obGlobal.folderScss, fisier);
            compileazaScss(caleScss);
        }
    });
}

// Apelăm la pornire
compileazaToateScss();


function watchScss() {
    if (!fs.existsSync(obGlobal.folderScss)) return;

    fs.watch(obGlobal.folderScss, (eventType, filename) => {
        if (filename && filename.endsWith('.scss')) {
            console.log(`Modificare detectată: ${filename}`);
            let caleScss = path.join(obGlobal.folderScss, filename);
            // Mică întârziere ca să fie siguri că fișierul e salvat complet
            setTimeout(() => {
                compileazaScss(caleScss);
            }, 100);
        }
    });
    console.log("Urmăresc modificări în folderul SCSS...");
}

watchScss();

app.use((req, res, next) => {
    const galPath = path.join(__dirname, 'resurse', 'json', 'galerie.json');

    if (!fs.existsSync(galPath)) {
        res.locals.galerieAnimata = null;
        return next();
    }

    try {
        const galObj = JSON.parse(fs.readFileSync(galPath, 'utf8'));

        let n;
        do {
            n = Math.floor(Math.random() * 5) + 7;
        } while (n === 10);

        const amestecate = [...galObj.imagini].sort(() => Math.random() - 0.5);
        const selectate = amestecate.slice(0, Math.min(n, amestecate.length));

        res.locals.galerieAnimata = {
            cale_galerie: galObj.cale_galerie,
            numar: selectate.length,
            imagini: selectate
        };

    } catch (e) {
        console.error("Eroare galerie animată:", e.message);
        res.locals.galerieAnimata = null;
    }

    next();
});

function initErori() {
    try {
        //Bonus A
        const errPath = path.join(__dirname, 'erori.json');
        if (!fs.existsSync(errPath)) {
            console.error("Nu exista fisierul erori.json");
            process.exit(1);
        }

        const data = fs.readFileSync(errPath, 'utf8');

        //  Detect duplicate property keys on the raw JSON string
        function checkDuplicateKeys(jsonString) {
            let hasDuplicates = false;
            let len = jsonString.length;

            for (let i = 0; i < len; i++) {
                if (jsonString[i] !== '{') continue;

                // Find the matching closing brace for this object
                let depth = 0;
                let inStr = false;
                let k = i;
                while (k < len) {
                    if (jsonString[k] === '\\' && inStr) { k += 2; continue; }
                    if (jsonString[k] === '"') { inStr = !inStr; k++; continue; }
                    if (!inStr) {
                        if (jsonString[k] === '{') depth++;
                        else if (jsonString[k] === '}') {
                            depth--;
                            if (depth === 0) { k++; break; }
                        }
                    }
                    k++;
                }
                let objStr = jsonString.slice(i, k);

                // Scan only the top-level key-value pairs of this object
                let keys = [];
                let values = [];
                let p = 1; // skip opening '{'
                let objLen = objStr.length;

                while (p < objLen) {
                    while (p < objLen && ' \t\n\r'.includes(objStr[p])) p++;
                    if (p >= objLen || objStr[p] === '}') break;
                    if (objStr[p] !== '"') { p++; continue; }

                    // Extract key string
                    let keyStart = p + 1;
                    p++;
                    while (p < objLen) {
                        if (objStr[p] === '\\') { p += 2; continue; }
                        if (objStr[p] === '"') break;
                        p++;
                    }
                    let key = objStr.slice(keyStart, p);
                    p++; // skip closing "

                    // Skip whitespace then expect ':'
                    while (p < objLen && ' \t\n\r'.includes(objStr[p])) p++;
                    if (objStr[p] !== ':') continue;
                    p++; // skip ':'
                    while (p < objLen && ' \t\n\r'.includes(objStr[p])) p++;

                    // Extract value (respecting nested depth)
                    let valStart = p;
                    let valDepth = 0;
                    let valInStr = false;
                    while (p < objLen) {
                        let vc = objStr[p];
                        if (vc === '\\' && valInStr) { p += 2; continue; }
                        if (vc === '"') { valInStr = !valInStr; p++; continue; }
                        if (!valInStr) {
                            if (vc === '{' || vc === '[') { valDepth++; }
                            else if (vc === '}' || vc === ']') {
                                if (valDepth === 0) break;
                                valDepth--;
                            } else if (vc === ',' && valDepth === 0) break;
                        }
                        p++;
                    }
                    keys.push(key);
                    values.push(objStr.slice(valStart, p).trim());
                    if (p < objLen && objStr[p] === ',') p++;
                }

                // Check for duplicate keys inside this object
                let seen = {};
                for (let m = 0; m < keys.length; m++) {
                    let key = keys[m];
                    if (seen[key] !== undefined) {
                        let objPreview = objStr.slice(0, 60);
                        console.error(`Proprietatea "${key}" este duplicată în obiectul: ${objPreview}...`);
                        console.error(`Valorile găsite: "${values[seen[key]]}" și "${values[m]}"`);
                        hasDuplicates = true;
                    } else {
                        seen[key] = m;
                    }
                }
            }

            if (hasDuplicates) process.exit(1);
        }
        checkDuplicateKeys(data);

        obGlobal.obErori = JSON.parse(data);
        //Bonus B
        if (!obGlobal.obErori.info_erori || !obGlobal.obErori.cale_baza || !obGlobal.obErori.eroare_default) {
            console.error("Lipseste una dintre proprietatile: info_erori, cale_baza, eroare_default din JSON");
            process.exit(1);
        }
        //Bonus C
        if (!obGlobal.obErori.eroare_default.titlu || !obGlobal.obErori.eroare_default.text || !obGlobal.obErori.eroare_default.imagine) {
            console.error("Pentru eroarea default lipseste titlu, text sau imagine");
            process.exit(1);
        }
        //Bonus D
        const basePath = path.join(__dirname, obGlobal.obErori.cale_baza);
        if (!fs.existsSync(basePath)) {
            console.error("Folderul specificat in cale_baza nu exista in sistemul de fisiere: " + basePath);
            process.exit(1);
        }

        // Task 4: Detect duplicate identificator values in info_erori
        let groupedByIdentificator = {};
        obGlobal.obErori.info_erori.forEach(err => {
            let id = err.identificator;
            if (!groupedByIdentificator[id]) groupedByIdentificator[id] = [];
            groupedByIdentificator[id].push(err);
        });
        let hasDuplicateIds = false;
        Object.entries(groupedByIdentificator).forEach(([id, entries]) => {
            if (entries.length > 1) {
                hasDuplicateIds = true;
                console.error(`Identificatorul ${id} apare de ${entries.length} ori în info_erori:`);
                entries.forEach(entry => {
                    console.error(`  - status: ${entry.status}, titlu: "${entry.titlu}", text: "${entry.text}", imagine: "${entry.imagine}"`);
                });
            }
        });
        if (hasDuplicateIds) process.exit(1);

        // Prefix base path to images so they render correctly on the web
        obGlobal.obErori.info_erori.forEach(err => {
            err.imagine = "/" + obGlobal.obErori.cale_baza + "/" + err.imagine;
        });
        obGlobal.obErori.eroare_default.imagine = "/" + obGlobal.obErori.cale_baza + "/" + obGlobal.obErori.eroare_default.imagine;

   
        let defaultImgPath = path.join(__dirname, obGlobal.obErori.eroare_default.imagine);
        if (!fs.existsSync(defaultImgPath)) {
            console.error("Imaginea pentru eroarea default nu există pe disc: " + defaultImgPath);
            process.exit(1);
        }
        obGlobal.obErori.info_erori.forEach(err => {
            let imgPath = path.join(__dirname, err.imagine);
            if (!fs.existsSync(imgPath)) {
                console.error("Imaginea pentru eroarea cu identificatorul " + err.identificator + " nu există pe disc: " + imgPath);
                process.exit(1);
            }
        });

    } catch (err) {
        console.error("Eroare initializare erori:", err);
        process.exit(1);
    }
}
initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let errDef = obGlobal.obErori.eroare_default;
    let errData = obGlobal.obErori.info_erori.find(e => e.identificator == identificator) || errDef;

    let t = titlu || errData.titlu || errDef.titlu;
    let txt = text || errData.text || errDef.text;
    let img = imagine || errData.imagine || errDef.imagine;

    let statusCode = 404;
    if (identificator && typeof identificator === 'number') statusCode = identificator;

    res.status(statusCode).render('pagini/eroare', { titlu: t, text: txt, imagine: img, ip: res.locals.ip });
}

// Set locals IP
app.use((req, res, next) => {
    res.locals.ip = req.ip || req.connection.remoteAddress;
    next();
});

// Protect .ejs files
app.get(/\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

// Favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/ico/favicon.ico"));
});

// Directory access forbidden
app.get(/^\/resurse\/.*/, (req, res, next) => {
    let filePath = path.join(__dirname, decodeURIComponent(req.path));
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
        afisareEroare(res, 403);
    } else {
        next();
    }
});

// Static files
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

// Middleware for gallery
app.use(async (req, res, next) => {
    const galPath = path.join(__dirname, 'resurse', 'json', 'galerie.json');
    if (!fs.existsSync(galPath)) {
        res.locals.galerie = null;
        return next();
    }
    try {
        const data = fs.readFileSync(galPath, 'utf8');
        const galObj = JSON.parse(data);
        const luni = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
        const lunaCurenta = luni[new Date().getMonth()];

        let selectate = galObj.imagini.filter(img => img.luni && img.luni.includes(lunaCurenta));
        selectate = selectate.slice(0, 12);

        let promisiuni = selectate.map(img => {
            return new Promise((resImg) => {
                let imgFile = path.join(__dirname, galObj.cale_galerie, img.cale_fisier);
                let dirMediu = path.join(__dirname, galObj.cale_galerie, 'mediu');
                let dirMic = path.join(__dirname, galObj.cale_galerie, 'mic');

                if (!fs.existsSync(dirMediu)) fs.mkdirSync(dirMediu, { recursive: true });
                if (!fs.existsSync(dirMic)) fs.mkdirSync(dirMic, { recursive: true });

                let fileMediu = path.join(dirMediu, img.cale_fisier);
                let fileMic = path.join(dirMic, img.cale_fisier);

                let calls = [];
                if (!fs.existsSync(fileMediu) && fs.existsSync(imgFile)) {
                    calls.push(sharp(imgFile).resize(400).toFile(fileMediu));
                }
                if (!fs.existsSync(fileMic) && fs.existsSync(imgFile)) {
                    calls.push(sharp(imgFile).resize(200).toFile(fileMic));
                }

                Promise.all(calls).then(() => resImg()).catch(() => resImg());
            });
        });

        await Promise.all(promisiuni);
        res.locals.galerie = { cale_galerie: galObj.cale_galerie, imagini: selectate };
    } catch (e) {
        console.error("Eroare galerie:", e);
        res.locals.galerie = null;
    }
    next();
});

// ── Date helpers ─────────────────────────────────────────────────────────────
const LUNI_RO = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
                 'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
const ZILE_RO = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];

function formateazaData(val) {
    if (!val) return { iso: '', ro: '–' };
    const d = new Date(val);
    if (isNaN(d.getTime())) return { iso: '', ro: '–' };
    const iso = d.toISOString().slice(0, 10);
    const ro = `${d.getDate()} ${LUNI_RO[d.getMonth()]} ${d.getFullYear()} [${ZILE_RO[d.getDay()]}]`;
    return { iso, ro };
}

const T_NOU_ZILE = 180; // Bonus 18: produs "NOU" daca adaugat in ultimele 180 zile

function pregatesteProdusBD(row, celMaiIeftinIds) {
    const { iso, ro } = formateazaData(row.data_adaugare);
    const zileDif = row.data_adaugare
        ? (Date.now() - new Date(row.data_adaugare).getTime()) / 86400000
        : Infinity;
    return {
        ...row,
        pret: parseFloat(row.pret),
        data_adaugare_iso: iso,
        data_adaugare_ro:  ro,
        celMaiIeftin: celMaiIeftinIds ? celMaiIeftinIds.has(row.id) : false,
        isNou: zileDif <= T_NOU_ZILE
    };
}

// ── Bonus 13: stergere automata fisiere backup mai vechi de 24h ───────────────
const BACKUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
function stergeBackupVechi(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(item => {
        const p = path.join(dir, item);
        if (fs.statSync(p).isDirectory()) {
            stergeBackupVechi(p);
        } else if (Date.now() - fs.statSync(p).mtimeMs > BACKUP_MAX_AGE_MS) {
            fs.unlinkSync(p);
            console.log(`Backup vechi sters: ${p}`);
        }
    });
}
setInterval(() => stergeBackupVechi(path.join(__dirname, 'backup')), 60 * 60 * 1000);

// ── Middleware: categorii pentru meniu (din enumeratia BD) ────────────────────
app.use(async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT e.enumlabel AS valoare
             FROM pg_enum e
             JOIN pg_type t ON e.enumtypid = t.oid
             WHERE t.typname = 'categorie_produs'
             ORDER BY e.enumsortorder`
        );
        res.locals.categoriiProduse = rows.map(r => r.valoare);
    } catch {
        res.locals.categoriiProduse = [];
    }
    next();
});

// ── Ruta: pagina produse ──────────────────────────────────────────────────────
app.get('/produse', async (req, res) => {
    try {
        const categorieActiva = req.query.categorie || null;
        const qProduse = categorieActiva
            ? 'SELECT * FROM produse WHERE categorie = $1 ORDER BY id'
            : 'SELECT * FROM produse ORDER BY id';

        // Bonus 1: toate atributele inputurilor generate din BD (8 tipuri)
        const [
            produseRes, minMaxRes, culoriRes, subcatRes,
            deceniiRes, materiiRes, celMaiIeftinRes, disponibilRes, maxLenRes
        ] = await Promise.all([
            pool.query(qProduse, categorieActiva ? [categorieActiva] : []),
            // Range min/max (tip range)
            pool.query('SELECT MIN(pret) AS min_pret, MAX(pret) AS max_pret FROM produse'),
            // Datalist culori (tip datalist)
            pool.query('SELECT DISTINCT culoare FROM produse WHERE culoare IS NOT NULL ORDER BY culoare'),
            // Select simplu subcategorii (tip select simplu)
            pool.query('SELECT DISTINCT subcategorie FROM produse WHERE subcategorie IS NOT NULL ORDER BY subcategorie'),
            // Select multiplu decenii (tip select multiplu)
            pool.query('SELECT DISTINCT deceniu FROM produse WHERE deceniu IS NOT NULL ORDER BY deceniu'),
            // Checkbox materiale (tip checkbox)
            pool.query('SELECT materiale FROM produse WHERE materiale IS NOT NULL'),
            // Bonus 14: cel mai ieftin produs per categorie
            pool.query('SELECT DISTINCT ON (categorie) id, categorie, pret FROM produse ORDER BY categorie, pret ASC'),
            // Radio disponibil (tip radio) – valori distincte din BD
            pool.query('SELECT DISTINCT disponibil FROM produse ORDER BY disponibil'),
            // Text maxlength (tip text) + Textarea maxlength (tip textarea)
            pool.query('SELECT MAX(LENGTH(nume)) AS max_len_nume, MAX(LENGTH(descriere)) AS max_len_descriere FROM produse')
        ]);

        // Bonus 14: set cu id-urile produselor cel mai ieftine per categorie
        const celMaiIeftinIds = new Set(celMaiIeftinRes.rows.map(r => r.id));

        const produse = produseRes.rows.map(r => pregatesteProdusBD(r, celMaiIeftinIds));

        const pretMin   = Math.floor(parseFloat(minMaxRes.rows[0].min_pret || 0));
        const pretMax   = Math.ceil(parseFloat(minMaxRes.rows[0].max_pret || 500));
        const culori    = culoriRes.rows.map(r => r.culoare);
        const subcategorii = subcatRes.rows.map(r => r.subcategorie);
        const decenii   = deceniiRes.rows.map(r => parseInt(r.deceniu));
        const materiale = [...new Set(
            materiiRes.rows.flatMap(r => r.materiale.split(',').map(m => m.trim()))
        )].sort();
        // Radio disponibil: valori din BD + "oricare" adaugat manual
        const disponibilValues = disponibilRes.rows.map(r => r.disponibil);
        const maxNume      = parseInt(maxLenRes.rows[0].max_len_nume) || 255;
        const maxDescriere = parseInt(maxLenRes.rows[0].max_len_descriere) || 1000;

        res.render('pagini/produse', {
            produse, categorieActiva,
            pretMin, pretMax,
            culori, subcategorii, decenii, materiale,
            disponibilValues, maxNume, maxDescriere
        });
    } catch (err) {
        console.error('Eroare ruta /produse:', err.message);
        afisareEroare(res, null, 'Eroare bază de date',
            'Nu s-a putut încărca lista de produse. Verificați conexiunea la PostgreSQL.', null);
    }
});

// ── Ruta: pagina produs unic + Bonus 16 (produse similare) ───────────────────
app.get('/produse/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) { afisareEroare(res, 404); return; }

        const [prodRes, simRes] = await Promise.all([
            pool.query('SELECT * FROM produse WHERE id = $1', [id]),
            pool.query(
                'SELECT id, nume, imagine, pret, categorie FROM produse WHERE id != $1 ORDER BY RANDOM() LIMIT 4',
                [id]
            )
        ]);
        if (prodRes.rows.length === 0) { afisareEroare(res, 404); return; }

        const produs = pregatesteProdusBD(prodRes.rows[0], null);
        // Bonus 16: produse similare (aceeasi categorie, aleatoriu)
        const similare = simRes.rows.map(r => ({ ...r, pret: parseFloat(r.pret) }));

        res.render('pagini/produs', { produs, similare });
    } catch (err) {
        console.error('Eroare ruta /produse/:id:', err.message);
        afisareEroare(res, null);
    }
});

// Home page – Bonus 18: trimite cele mai noi produse
app.get(['/', '/index', '/home'], async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, nume, imagine, pret, categorie, data_adaugare
             FROM produse
             ORDER BY data_adaugare DESC NULLS LAST
             LIMIT 4`
        );
        const produseNoi = rows.map(r => ({
            ...r,
            pret: parseFloat(r.pret),
            ...formateazaData(r.data_adaugare)
        }));
        res.render('pagini/index', { produseNoi });
    } catch {
        res.render('pagini/index', { produseNoi: [] });
    }
});

// Catch all for EJS rendering
app.get(/.*/, (req, res) => {
    let requestedPage = req.path.slice(1);
    res.render('pagini/' + requestedPage, {}, function (eroare, rezultatRandare) {
        if (eroare && eroare.message.startsWith("Failed to lookup view")) {
            afisareEroare(res, 404);
        } else if (eroare) {
            afisareEroare(res, null);
        } else {
            res.send(rezultatRandare);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
