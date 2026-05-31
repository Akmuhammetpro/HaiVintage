const fs = require('fs');
const path = require('path');
const https = require('https');

const dirJson = path.join(__dirname, 'resurse', 'json');
const dirImg = path.join(__dirname, 'resurse', 'img', 'galerie');

if (!fs.existsSync(dirJson)) fs.mkdirSync(dirJson, { recursive: true });
if (!fs.existsSync(dirImg)) fs.mkdirSync(dirImg, { recursive: true });

const months = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

const images = [];
let downloaded = 0;

for (let i = 1; i <= 14; i++) {
    const filename = `img${i}.jpg`;
    const filepath = path.join(dirImg, filename);
    
    // Some random months for each image
    const numMonths = Math.floor(Math.random() * 4) + 1; // 1 to 4 months
    const imgMonths = [];
    while (imgMonths.length < numMonths) {
        const m = months[Math.floor(Math.random() * months.length)];
        if (!imgMonths.includes(m)) imgMonths.push(m);
    }
    // ensure all months have at least some images by adding the current month to some of them
    const currentMonth = months[new Date().getMonth()];
    if (i % 2 === 0 && !imgMonths.includes(currentMonth)) {
        imgMonths.push(currentMonth);
    }

    images.push({
        cale_fisier: filename,
        titlu: `Vintage Item ${i}`,
        alt: `Alt text for vintage item ${i}`,
        text_descriere: `This is a beautiful vintage item number ${i}.`,
        luni: imgMonths,
        licenta: i === 1 ? "CC-BY" : undefined,
        autor: i === 1 ? "Author Name" : undefined
    });

    if (!fs.existsSync(filepath)) {
        https.get(`https://picsum.photos/800/600?random=${i}`, (res) => {
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                downloaded++;
                if (downloaded === 14) console.log("All images downloaded");
            });
        });
    } else {
        downloaded++;
    }
}

const jsonContent = {
    cale_galerie: "/resurse/img/galerie",
    imagini: images
};

fs.writeFileSync(path.join(dirJson, 'galerie.json'), JSON.stringify(jsonContent, null, 4));
console.log("JSON generated");
