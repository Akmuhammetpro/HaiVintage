const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sass = require('sass');
const app = express();
const port = 8080;

console.log("Director:", __dirname);
console.log("Fisier:", __filename);
console.log("Work process director:", process.cwd());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create required directories
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
    folderCss:  path.join(__dirname, 'resurse', 'css')
};

function compileazaScss(caleScss, caleCss) {
    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(obGlobal.folderScss, caleScss);
    }
    if (!caleCss) {
        let numeFisier = path.basename(caleScss, '.scss') + '.css';
        caleCss = path.join(obGlobal.folderCss, numeFisier);
    } else if (!path.isAbsolute(caleCss)) {
        caleCss = path.join(obGlobal.folderCss, caleCss);
    }

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

compileazaToateScss();

function watchScss() {
    if (!fs.existsSync(obGlobal.folderScss)) return;
    fs.watch(obGlobal.folderScss, (eventType, filename) => {
        if (filename && filename.endsWith('.scss')) {
            console.log(`Modificare detectată: ${filename}`);
            let caleScss = path.join(obGlobal.folderScss, filename);
            setTimeout(() => {
                compileazaScss(caleScss);
            }, 100);
        }
    });
    console.log("Urmăresc modificări în folderul SCSS...");
}

watchScss();

// ── GALERIE ANIMATĂ – generare JSON la pornirea serverului ───────────────────
function genereazaGalerieAnimata() {
    const galPath = path.join(__dirname, 'resurse', 'json', 'galerie.json');
    const outPath = path.join(__dirname, 'resurse', 'json', 'galerie-animata.json');

    if (!fs.existsSync(galPath)) {
        console.log("galerie.json lipsește – galeria animată nu va fi generată.");
        return;
    }

    try {
        const galObj = JSON.parse(fs.readFileSync(galPath, 'utf8'));

        // Număr aleator 7–11, diferit de 10
        let n;
        do { n = Math.floor(Math.random() * 5) + 7; } while (n === 10);

        // Alege N imagini distincte aleator
        const amestecate = [...galObj.imagini].sort(() => Math.random() - 0.5);
        const selectate  = amestecate.slice(0, Math.min(n, amestecate.length));

        fs.writeFileSync(outPath, JSON.stringify({
            cale_galerie: galObj.cale_galerie,
            numar: selectate.length,
            imagini: selectate
        }, null, 2), 'utf8');

        console.log(`Galerie animată generată: ${selectate.length} imagini → ${outPath}`);
    } catch (e) {
        console.error("Eroare generare galerie animată:", e.message);
    }
}

genereazaGalerieAnimata();
// ─────────────────────────────────────────────────────────────────────────────

function initErori() {
    try {
        const errPath = path.join(__dirname, 'erori.json');
        if (!fs.existsSync(errPath)) {
            console.error("Nu exista fisierul erori.json");
            process.exit(1);
        }

        const data = fs.readFileSync(errPath, 'utf8');

        function checkDuplicateKeys(jsonString) {
            let hasDuplicates = false;
            let len = jsonString.length;

            for (let i = 0; i < len; i++) {
                if (jsonString[i] !== '{') continue;

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

                let keys = [];
                let values = [];
                let p = 1;
                let objLen = objStr.length;

                while (p < objLen) {
                    while (p < objLen && ' \t\n\r'.includes(objStr[p])) p++;
                    if (p >= objLen || objStr[p] === '}') break;
                    if (objStr[p] !== '"') { p++; continue; }

                    let keyStart = p + 1;
                    p++;
                    while (p < objLen) {
                        if (objStr[p] === '\\') { p += 2; continue; }
                        if (objStr[p] === '"') break;
                        p++;
                    }
                    let key = objStr.slice(keyStart, p);
                    p++;

                    while (p < objLen && ' \t\n\r'.includes(objStr[p])) p++;
                    if (objStr[p] !== ':') continue;
                    p++;
                    while (p < objLen && ' \t\n\r'.includes(objStr[p])) p++;

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

        if (!obGlobal.obErori.info_erori || !obGlobal.obErori.cale_baza || !obGlobal.obErori.eroare_default) {
            console.error("Lipseste una dintre proprietatile: info_erori, cale_baza, eroare_default din JSON");
            process.exit(1);
        }
        if (!obGlobal.obErori.eroare_default.titlu || !obGlobal.obErori.eroare_default.text || !obGlobal.obErori.eroare_default.imagine) {
            console.error("Pentru eroarea default lipseste titlu, text sau imagine");
            process.exit(1);
        }
        const basePath = path.join(__dirname, obGlobal.obErori.cale_baza);
        if (!fs.existsSync(basePath)) {
            console.error("Folderul specificat in cale_baza nu exista in sistemul de fisiere: " + basePath);
            process.exit(1);
        }

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

        obGlobal.obErori.info_erori.forEach(err => {
            err.imagine = "/" + obGlobal.obErori.cale_baza + "/" + err.imagine;
        });
        obGlobal.obErori.eroare_default.imagine = "/" + obGlobal.obErori.cale_baza + "/" + obGlobal.obErori.eroare_default.imagine;

        let defaultImgPath = path.join(__dirname, obGlobal.obErori.eroare_default.imagine.slice(1));
        if (!fs.existsSync(defaultImgPath)) {
            console.error("Imaginea pentru eroarea default nu există pe disc: " + defaultImgPath);
            process.exit(1);
        }
        obGlobal.obErori.info_erori.forEach(err => {
            let imgPath = path.join(__dirname, err.imagine.slice(1));
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

    let t   = titlu  || errData.titlu  || errDef.titlu;
    let txt = text   || errData.text   || errDef.text;
    let img = imagine|| errData.imagine|| errDef.imagine;

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

// ── Middleware galerie STATICĂ ────────────────────────────────────────────────
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
                let imgFile  = path.join(__dirname, galObj.cale_galerie, img.cale_fisier);
                let dirMediu = path.join(__dirname, galObj.cale_galerie, 'mediu');
                let dirMic   = path.join(__dirname, galObj.cale_galerie, 'mic');

                if (!fs.existsSync(dirMediu)) fs.mkdirSync(dirMediu, { recursive: true });
                if (!fs.existsSync(dirMic))   fs.mkdirSync(dirMic,   { recursive: true });

                let fileMediu = path.join(dirMediu, img.cale_fisier);
                let fileMic   = path.join(dirMic,   img.cale_fisier);

                let calls = [];
                if (!fs.existsSync(fileMediu) && fs.existsSync(imgFile))
                    calls.push(sharp(imgFile).resize(400).toFile(fileMediu));
                if (!fs.existsSync(fileMic) && fs.existsSync(imgFile))
                    calls.push(sharp(imgFile).resize(200).toFile(fileMic));

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

// ── Middleware galerie ANIMATĂ ────────────────────────────────────────────────
app.use((req, res, next) => {
    const gaPath = path.join(__dirname, 'resurse', 'json', 'galerie-animata.json');
    if (!fs.existsSync(gaPath)) {
        res.locals.galerieAnimata = null;
        return next();
    }
    try {
        res.locals.galerieAnimata = JSON.parse(fs.readFileSync(gaPath, 'utf8'));
    } catch (e) {
        console.error("Eroare galerie animată middleware:", e.message);
        res.locals.galerieAnimata = null;
    }
    next();
});
// ─────────────────────────────────────────────────────────────────────────────

// Home page
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index');
});

// Catch all for EJS rendering
app.get(/.*/, (req, res) => {
    let requestedPage = req.path.slice(1);
    res.render('pagini/' + requestedPage, {}, function(eroare, rezultatRandare) {
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