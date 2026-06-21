-- ============================================================
-- HaiVintage – schema si date initiale PostgreSQL
-- Rulati ca superuser: psql -U postgres -f schema.sql
-- ============================================================

-- 1. Creati baza de date si userul aplicatiei
-- (decomentati daca nu exista deja)
-- CREATE DATABASE haivintage;
-- CREATE USER haivintage_user WITH PASSWORD 'haivintage_pass';
-- GRANT ALL PRIVILEGES ON DATABASE haivintage TO haivintage_user;

-- Conectati-va la baza de date inainte de comenzile urmatoare:
-- \c haivintage

-- 2. Stergere obiecte existente (pentru re-rulare curata)
DROP TABLE IF EXISTS produse;
DROP TYPE IF EXISTS categorie_produs;

-- 3. Enumeratie pentru categoria mare
CREATE TYPE categorie_produs AS ENUM (
    'dama',
    'barbati',
    'accesorii',
    'incaltaminte',
    'bijuterii'
);

-- 4. Tabelul de produse
CREATE TABLE produse (
    id              SERIAL PRIMARY KEY,
    nume            VARCHAR(255) NOT NULL,
    descriere       TEXT,
    imagine         VARCHAR(500),
    categorie       categorie_produs NOT NULL,
    subcategorie    VARCHAR(100),
    pret            DECIMAL(10,2) NOT NULL,
    deceniu         INTEGER,
    data_adaugare   DATE DEFAULT CURRENT_DATE,
    culoare         VARCHAR(100),
    materiale       VARCHAR(500),
    disponibil      BOOLEAN DEFAULT TRUE
);

-- 5. Drepturi pentru userul aplicatiei
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE produse TO haivintage_user;
GRANT USAGE, SELECT ON SEQUENCE produse_id_seq TO haivintage_user;

-- 6. Date de test (15-20 produse diversificate)
INSERT INTO produse (nume, descriere, imagine, categorie, subcategorie, pret, deceniu, data_adaugare, culoare, materiale, disponibil) VALUES
('Jachetă denim anii ''80',
 'Jachetă denim autentică din anii ''80, cu broderie pe spate și nasturi metalici vintage. Talie mică, potrivită pentru XS–M.',
 '/resurse/img/produse/jacheta-denim.jpg',
 'dama', 'casual', 180.00, 1980, '2024-01-15', 'albastru', 'denim,bumbac', true),

('Rochie florală anii ''70',
 'Rochie midi cu imprimeu floral vibrant, specifică stilului boho din anii ''70. Material ușor, perfectă pentru vară.',
 '/resurse/img/produse/rochie-florala.jpg',
 'dama', 'boho', 220.00, 1970, '2024-02-10', 'galben', 'bumbac,poliester', true),

('Cămașă de flanelă bărbați',
 'Cămașă clasică de flanelă în carouri, foarte populară în anii ''70. Stare excelentă, fără uzuri.',
 '/resurse/img/produse/camasa-flanela.jpg',
 'barbati', 'casual', 120.00, 1970, '2024-01-20', 'rosu', 'flanel,bumbac', true),

('Pantaloni evazați',
 'Pantaloni evazați iconici din lână, talie înaltă, anii ''70. Stil boho perfect pentru o ținută retro.',
 '/resurse/img/produse/pantaloni-evazati.jpg',
 'dama', 'boho', 140.00, 1975, '2024-03-01', 'maro', 'lana,bumbac', true),

('Geantă din piele retro',
 'Geantă structurată din piele naturală, design elegant din anii ''60. Feronerie aurie originală.',
 '/resurse/img/produse/geanta-piele.jpg',
 'accesorii', 'vintage_clasic', 250.00, 1960, '2024-02-20', 'maro', 'piele', true),

('Pălărie fedora',
 'Pălărie fedora autentică din fetru negru, din anii ''50. Stil clasic, impecabilă.',
 '/resurse/img/produse/palarie-fedora.jpg',
 'accesorii', 'formal', 95.00, 1950, '2024-01-10', 'negru', 'fetru,lana', true),

('Sacou tweed bărbați',
 'Sacou elegant din tweed britanic, cu coatele din piele. Stil academic clasic, perfect pentru ocazii formale.',
 '/resurse/img/produse/sacou-tweed.jpg',
 'barbati', 'formal', 300.00, 1965, '2024-03-15', 'gri', 'tweed,lana,in', true),

('Blugi skinny vintage',
 'Blugi skinny autentici din anii ''85, nuanță spălăcită specifică epocii. Potriviți pentru talie mică.',
 '/resurse/img/produse/blugi-skinny.jpg',
 'dama', 'casual', 160.00, 1985, '2024-04-01', 'albastru', 'denim', true),

('Pantofi Mary Jane',
 'Pantofi clasici Mary Jane din piele naturală, emblematici pentru anii ''55. Toc mic, confort deosebit.',
 '/resurse/img/produse/pantofi-mary-jane.jpg',
 'incaltaminte', 'vintage_clasic', 175.00, 1955, '2024-02-05', 'negru', 'piele,cauciuc', true),

('Cizme cu toc anii ''70',
 'Cizme din piele cu toc înalt tip platformă, specifice anilor ''75. Necesită recondiționare minoră.',
 '/resurse/img/produse/cizme-toc.jpg',
 'incaltaminte', 'formal', 280.00, 1975, '2024-03-20', 'maro', 'piele,piele_intoarsa', false),

('Colier perle clasic',
 'Colier cu perle naturale, montat manual pe fir de mătase, tipic pentru eleganța anilor ''40. Bijuterie rară.',
 '/resurse/img/produse/colier-perle.jpg',
 'bijuterii', 'formal', 350.00, 1940, '2024-01-25', 'crem', 'metal,perla', true),

('Cercei rotunzi email',
 'Cercei circulari cu email colorat, specifici stilului boho al anilor ''70. Greutate ușoară, confortabili.',
 '/resurse/img/produse/cercei-rotunzi.jpg',
 'bijuterii', 'boho', 85.00, 1970, '2024-02-15', 'auriu', 'metal,email', true),

('Vestă din piele bărbați',
 'Vestă biker din piele naturală neagră, cu fermoar metalic vintage. Stare excelentă, potrivită M–L.',
 '/resurse/img/produse/vesta-piele.jpg',
 'barbati', 'casual', 195.00, 1980, '2024-04-10', 'negru', 'piele', true),

('Fustă midi plisată',
 'Fustă midi plisată din lână fină, stil vintage clasic al anilor ''60. Talie elastică, se potrivește XS–M.',
 '/resurse/img/produse/fusta-midi.jpg',
 'dama', 'vintage_clasic', 130.00, 1960, '2024-03-05', 'verde', 'lana,bumbac', false),

('Tricou cu imprimeu sport',
 'Tricou bărbătesc cu imprimeu grafic retro din anii ''85. Stare bună, material 100% bumbac.',
 '/resurse/img/produse/tricou-imprimeu.jpg',
 'barbati', 'sport', 75.00, 1985, '2024-04-20', 'alb', 'bumbac', true),

('Eșarfă mătase elegantă',
 'Eșarfă de mătase naturală cu imprimeu floral, design francez din anii ''65. Versatilă, poate fi purtată în mai multe moduri.',
 '/resurse/img/produse/esarfa-matase.jpg',
 'accesorii', 'formal', 110.00, 1965, '2024-01-30', 'rosu', 'matase', true),

('Brățară argint vintage',
 'Brățară artizanală din argint 925, cu motive geometrice specifice anilor ''50. Marcaj de autenticitate gravat.',
 '/resurse/img/produse/bratara-argint.jpg',
 'bijuterii', 'vintage_clasic', 145.00, 1950, '2024-02-28', 'argintiu', 'argint,metal', true),

('Pantaloni drepți bărbați',
 'Pantaloni drepți din lână și bumbac, croială clasică anilor ''70. Eleganță sobră pentru ținute formale.',
 '/resurse/img/produse/pantaloni-drepti.jpg',
 'barbati', 'formal', 185.00, 1970, '2024-05-01', 'gri', 'lana,bumbac', true);
