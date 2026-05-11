const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080;

console.log("Director:", __dirname);
console.log("Fisier:", __filename);
console.log("Director de lucru:", process.cwd());

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
        const errPath = path.join(__dirname, 'erori.json');
        if (!fs.existsSync(errPath)) {
            console.error("Nu exista fisierul erori.json");
            process.exit(1);
        }
        
        const data = fs.readFileSync(errPath, 'utf8');
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

        // Prefix base path to images so they render correctly on the web
        obGlobal.obErori.info_erori.forEach(err => {
            err.imagine = "/" + obGlobal.obErori.cale_baza + "/" + err.imagine;
        });
        obGlobal.obErori.eroare_default.imagine = "/" + obGlobal.obErori.cale_baza + "/" + obGlobal.obErori.eroare_default.imagine;

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
    let pagePath = path.join(__dirname, 'views', 'pagini', requestedPage + '.ejs');
    if (fs.existsSync(pagePath)) {
        res.render('pagini/' + requestedPage);
    } else {
        afisareEroare(res, 404);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
