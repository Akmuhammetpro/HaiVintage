const express = require('express');
const path = require('path');
const fs = require('fs');

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

let obGlobal = { obErori: null };

function initErori() {
    try {
        //Bonus A
        const errPath = path.join(__dirname, 'erori.json');
        if (!fs.existsSync(errPath)) {
            console.error("Nu exista fisierul erori.json");
            process.exit(1);
        }

        const data = fs.readFileSync(errPath, 'utf8');

        // Task 3: Detect duplicate property keys on the raw JSON string
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

        // Task 2: Check that every error image file exists on disk
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
