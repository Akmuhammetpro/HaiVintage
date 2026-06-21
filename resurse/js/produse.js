(function () {
    'use strict';

    // ── Bonus 7: Normalizare diacritice ──────────────────────────────────────
    function normalizeRo(str) {
        return str
            .toLowerCase()
            .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
            .replace(/[ăâ]/g, 'a').replace(/î/g, 'i')
            .replace(/[ĂÂ]/g, 'a').replace(/Î/g, 'i')
            .replace(/[ȘŞ]/g, 's').replace(/[ȚŢ]/g, 't');
    }

    // ── Levenshtein ───────────────────────────────────────────────────────────
    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[m][n];
    }

    // Bonus 7: fuzzy match cu diacritice normalizate
    function fuzzyMatch(text, query) {
        if (!query) return true;
        const t = normalizeRo(text);
        const q = normalizeRo(query);
        if (t.includes(q)) return true;
        return t.split(/\s+/).some(w => levenshtein(w, q) <= 2);
    }

    // ── Bonus 6: Bonus 6 – Bonus 13 setInterval este in index.js ─────────────
    // Bonus 6: sesiune delete list (sessionStorage)
    const KEY_SESIUNE = 'produse_eliminate_sesiune';
    function getEliminateSesiune() {
        try { return new Set(JSON.parse(sessionStorage.getItem(KEY_SESIUNE) || '[]')); }
        catch { return new Set(); }
    }
    function salveazaEliminateSesiune(set) {
        sessionStorage.setItem(KEY_SESIUNE, JSON.stringify([...set]));
    }

    // ── DOM helpers ───────────────────────────────────────────────────────────
    function articles() { return Array.from(document.querySelectorAll('.produs-articol')); }
    const inpNume      = () => document.getElementById('filtru-nume');
    const inpRange     = () => document.getElementById('filtru-pret');
    const inpRangeVal  = () => document.getElementById('filtru-pret-val');
    const inpCuloare   = () => document.getElementById('filtru-culoare');
    const inpTextarea  = () => document.getElementById('filtru-descriere');
    const selSubcat    = () => document.getElementById('filtru-subcategorie');
    const selDeceniu   = () => document.getElementById('filtru-deceniu');

    // ── Range live update ─────────────────────────────────────────────────────
    const rangeEl = inpRange();
    const rangeValEl = inpRangeVal();
    if (rangeEl && rangeValEl) {
        const updateRange = () => { rangeValEl.textContent = rangeEl.value + ' RON'; };
        rangeEl.addEventListener('input', updateRange);
        updateRange();
    }

    // ── Bonus 5: Paginare ─────────────────────────────────────────────────────
    const K = 6; // elemente per pagina
    let paginaCurenta = 1;

    function articoleVizibileFiltrare() {
        return articles().filter(a =>
            a.style.display !== 'none' &&
            !a.classList.contains('eliminat-sesiune')
        );
    }

    function afiseazaPagina(p) {
        paginaCurenta = p;
        const vizibile = articoleVizibileFiltrare();
        const start = (p - 1) * K;
        const end = p * K;
        vizibile.forEach((a, i) => {
            a.classList.toggle('pagina-ascuns', i < start || i >= end);
        });
        genereazaPaginare(vizibile.length);
    }

    function genereazaPaginare(total) {
        const nav = document.getElementById('paginare');
        const lista = document.getElementById('lista-pagini');
        if (!nav || !lista) return;
        const nrPagini = Math.ceil(total / K);
        if (nrPagini <= 1) { nav.style.display = 'none'; return; }
        nav.style.display = '';
        lista.innerHTML = '';
        for (let i = 1; i <= nrPagini; i++) {
            const li = document.createElement('li');
            li.className = 'page-item' + (i === paginaCurenta ? ' active' : '');
            li.innerHTML = `<button class="page-link">${i}</button>`;
            li.querySelector('button').addEventListener('click', () => afiseazaPagina(i));
            lista.appendChild(li);
        }
    }

    // ── Bonus 15: Contor produse vizibile ─────────────────────────────────────
    function updateContor() {
        const viz = articoleVizibileFiltrare().length;
        const total = articles().length;
        const el = document.getElementById('nr-vizibile');
        if (el) el.textContent = viz;
        // Ajustam si textul total
        const contor = document.getElementById('contor-produse');
        if (contor) {
            contor.innerHTML = `<i class="bi bi-grid-3x3-gap"></i> Se afișează <strong id="nr-vizibile">${viz}</strong> din <strong>${total}</strong> produse`;
        }
    }

    // ── Bonus 3: Mesaj nicio produs ──────────────────────────────────────────
    function updateMesajGol() {
        const mesaj = document.getElementById('mesaj-gol');
        if (!mesaj) return;
        mesaj.style.display = articoleVizibileFiltrare().length === 0 ? '' : 'none';
    }

    // ── Validare ──────────────────────────────────────────────────────────────
    function validareInputuri() {
        const errors = [];
        const inpN = inpNume();
        if (inpN && inpN.value.trim() !== '' && /\d/.test(inpN.value)) {
            errors.push('Câmpul "Nume produs" nu poate conține cifre.');
        }
        const ta = inpTextarea();
        if (ta) {
            if (ta.value.trim() === '') {
                ta.classList.add('is-invalid');
            } else {
                ta.classList.remove('is-invalid');
            }
        }
        return errors;
    }

    function afisareErori(errors) {
        const c = document.getElementById('erori-filtre');
        if (!c) return;
        if (errors.length === 0) { c.style.display = 'none'; c.innerHTML = ''; return; }
        c.innerHTML = '<strong>Erori:</strong><ul>' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        c.style.display = '';
    }

    // ── Materiale ─────────────────────────────────────────────────────────────
    function getMaterialeFiltre() {
        const res = [];
        document.querySelectorAll('.cb-material:checked').forEach(cb => {
            const g = cb.closest('.grup-material-item');
            const r = g ? g.querySelector('input[type="radio"]:checked') : null;
            res.push({ material: cb.value, mod: r ? r.value : 'are' });
        });
        return res;
    }

    // ── Checkbox material: show/hide are/nu-are radios ────────────────────────
    document.querySelectorAll('.cb-material').forEach(cb => {
        const modDiv = document.getElementById('mod-' + cb.value);
        const toggle = () => { if (modDiv) modDiv.style.display = cb.checked ? 'inline-flex' : 'none'; };
        cb.addEventListener('change', toggle);
        toggle();
    });

    // ── Core filtru ───────────────────────────────────────────────────────────
    function filtreaza() {
        const errors = validareInputuri();
        afisareErori(errors);
        if (errors.length > 0) return;

        const queryNume     = inpNume()?.value.trim() || '';
        const pretMax       = parseFloat(inpRange()?.value) || Infinity;
        const queryCuloare  = normalizeRo(inpCuloare()?.value.trim() || '');
        const queryDescr    = normalizeRo(inpTextarea()?.value.trim() || '');
        const subcatFiltru  = selSubcat()?.value || '';
        const deceniiFiltru = selDeceniu()
            ? Array.from(selDeceniu().selectedOptions).map(o => parseInt(o.value))
            : [];
        const radioDisp     = document.querySelector('input[name="filtru-disponibil"]:checked');
        const disponibilF   = radioDisp ? radioDisp.value : 'oricare';
        const materialeFiltru = getMaterialeFiltre();
        const eliminateSes  = getEliminateSesiune();

        articles().forEach(art => {
            // Produsele pinned sunt intotdeauna vizibile
            if (art.classList.contains('pinned')) {
                art.style.display = '';
                art.classList.remove('pagina-ascuns');
                return;
            }
            // Produsele eliminate din sesiune raman ascunse
            if (eliminateSes.has(art.dataset.id)) {
                art.style.display = 'none';
                art.classList.add('eliminat-sesiune');
                return;
            }

            const nume      = art.dataset.nume || '';
            const pret      = parseFloat(art.dataset.pret) || 0;
            const culoare   = normalizeRo(art.dataset.culoare || '');
            const descriere = normalizeRo(art.dataset.descriere || '');
            const subcat    = art.dataset.subcategorie || '';
            const deceniu   = parseInt(art.dataset.deceniu) || 0;
            const disponibil = art.dataset.disponibil === 'true';
            const materiale = (art.dataset.materiale || '').split(',').map(m => normalizeRo(m.trim()));

            let viz = true;
            if (queryNume && !fuzzyMatch(nume, queryNume)) viz = false;
            if (pret > pretMax) viz = false;
            if (queryCuloare && !culoare.includes(queryCuloare)) viz = false;
            if (queryDescr && !descriere.includes(queryDescr)) viz = false;
            if (subcatFiltru && subcat !== subcatFiltru) viz = false;
            if (deceniiFiltru.length > 0 && !deceniiFiltru.includes(deceniu)) viz = false;
            if (disponibilF === 'disponibil' && !disponibil) viz = false;
            if (disponibilF === 'indisponibil' && disponibil) viz = false;
            materialeFiltru.forEach(({ material, mod }) => {
                const are = materiale.includes(normalizeRo(material));
                if (mod === 'are' && !are) viz = false;
                if (mod === 'nu_are' && are) viz = false;
            });

            art.style.display = viz ? '' : 'none';
            art.classList.remove('pagina-ascuns');
        });

        paginaCurenta = 1;
        afiseazaPagina(1);
        updateContor();
        updateMesajGol();
    }

    // ── Bonus 8: Sortare cu chei selectabile ──────────────────────────────────
    function getValoareCheie(art, cheie) {
        switch (cheie) {
            case 'ratio':   return (parseFloat(art.dataset.deceniu) || 0) / (parseFloat(art.dataset.pret) || 1);
            case 'pret':    return parseFloat(art.dataset.pret) || 0;
            case 'deceniu': return parseInt(art.dataset.deceniu) || 0;
            case 'nume':    return normalizeRo(art.dataset.nume || '');
            case 'data':    return art.dataset.data || '';
            case 'subcategorie': return normalizeRo(art.dataset.subcategorie || '');
            case 'culoare': return normalizeRo(art.dataset.culoare || '');
            case 'disponibil': return art.dataset.disponibil === 'true' ? 1 : 0;
            default: return 0;
        }
    }

    function sorteaza(descendent) {
        const grid = document.getElementById('produse-grid');
        if (!grid) return;
        const cheie1 = document.getElementById('sort-cheie1')?.value || 'ratio';
        const cheie2 = document.getElementById('sort-cheie2')?.value || 'subcategorie';

        const sortate = articles().sort((a, b) => {
            const v1a = getValoareCheie(a, cheie1);
            const v1b = getValoareCheie(b, cheie1);
            const diff1 = typeof v1a === 'number'
                ? v1a - v1b
                : String(v1a).localeCompare(String(v1b), 'ro');
            if (Math.abs(typeof diff1 === 'number' ? diff1 : 1) > 0.0001 || diff1 !== 0) {
                return descendent ? -diff1 : diff1;
            }
            const v2a = getValoareCheie(a, cheie2);
            const v2b = getValoareCheie(b, cheie2);
            const diff2 = typeof v2a === 'number'
                ? v2a - v2b
                : String(v2a).localeCompare(String(v2b), 'ro');
            return descendent ? -diff2 : diff2;
        });
        sortate.forEach(a => grid.appendChild(a));
        afiseazaPagina(1);
    }

    // ── Calcul media ──────────────────────────────────────────────────────────
    function calculeaza() {
        const viz = articoleVizibileFiltrare();
        if (viz.length === 0) { afisareRezultat('Nu există produse vizibile.'); return; }
        const total = viz.reduce((s, a) => s + (parseFloat(a.dataset.pret) || 0), 0);
        const media = (total / viz.length).toFixed(2);
        afisareRezultat(`Media prețurilor (${viz.length} produse): ${media} RON`);
    }

    function afisareRezultat(mesaj) {
        const div = document.createElement('div');
        div.className = 'rezultat-calcul';
        div.textContent = mesaj;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    // ── Reset ─────────────────────────────────────────────────────────────────
    function reset() {
        if (!confirm('Doriți să resetați toate filtrele?')) return;

        ['filtru-nume', 'filtru-culoare'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const ta = inpTextarea();
        if (ta) { ta.value = ''; ta.classList.remove('is-invalid'); }
        const r = inpRange();
        if (r) { r.value = r.max; if (inpRangeVal()) inpRangeVal().textContent = r.max + ' RON'; }
        const ss = selSubcat(); if (ss) ss.value = '';
        if (selDeceniu()) Array.from(selDeceniu().options).forEach(o => o.selected = false);

        const radDefault = document.querySelector('input[name="filtru-disponibil"][value="oricare"]');
        if (radDefault) radDefault.checked = true;

        document.querySelectorAll('.cb-material').forEach(cb => {
            cb.checked = false;
            const mod = document.getElementById('mod-' + cb.value);
            if (mod) {
                mod.style.display = 'none';
                const radAre = mod.querySelector('input[value="are"]');
                if (radAre) radAre.checked = true;
            }
        });

        afisareErori([]);
        articles().forEach(a => {
            a.style.display = '';
            a.classList.remove('pagina-ascuns', 'ascuns-temp');
        });

        // Restore original order by id
        const grid = document.getElementById('produse-grid');
        if (grid) {
            [...grid.querySelectorAll('.produs-articol')]
                .sort((a, b) => parseInt(a.dataset.id) - parseInt(b.dataset.id))
                .forEach(a => grid.appendChild(a));
        }

        paginaCurenta = 1;
        afiseazaPagina(1);
        updateContor();
        updateMesajGol();
    }

    // ── Bonus 6: 3 butoane per produs ────────────────────────────────────────
    function initButoaneProdus() {
        const eliminateSes = getEliminateSesiune();

        // Aplica starea salvata din sessionStorage
        articles().forEach(art => {
            if (eliminateSes.has(art.dataset.id)) {
                art.style.display = 'none';
                art.classList.add('eliminat-sesiune');
            }
        });

        document.querySelectorAll('.btn-pin').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const art = btn.closest('.produs-articol');
                const isPinned = art.classList.toggle('pinned');
                btn.title = isPinned
                    ? 'Dezactivează fixarea'
                    : 'Fixează (rămâne vizibil chiar și la filtrare)';
                btn.querySelector('i').className = isPinned ? 'bi bi-pin-fill' : 'bi bi-pin-angle';
            });
        });

        document.querySelectorAll('.btn-ascunde-temp').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const art = btn.closest('.produs-articol');
                art.classList.add('ascuns-temp');
                art.style.display = 'none';
                updateContor();
                updateMesajGol();
                afiseazaPagina(paginaCurenta);
            });
        });

        document.querySelectorAll('.btn-elimina-sesiune').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const art = btn.closest('.produs-articol');
                const set = getEliminateSesiune();
                set.add(art.dataset.id);
                salveazaEliminateSesiune(set);
                art.classList.add('eliminat-sesiune');
                art.style.display = 'none';
                updateContor();
                updateMesajGol();
                afiseazaPagina(paginaCurenta);
            });
        });
    }

    // ── Bonus 11: Modal pe click pe produs ────────────────────────────────────
    function initModal() {
        const overlay = document.getElementById('modal-produs');
        const continut = document.getElementById('modal-continut');
        const closeBtn = document.getElementById('modal-close');
        if (!overlay || !continut || !closeBtn) return;

        function inchideModal() { overlay.style.display = 'none'; document.body.style.overflow = ''; }
        function deschideModal(art) {
            const img = art.querySelector('img');
            const imgSrc = img ? img.src : '';
            const disponibil = art.dataset.disponibil === 'true';
            continut.innerHTML = `
                <h3 style="margin:0 0 0.8rem">${art.dataset.nume}</h3>
                ${imgSrc ? `<img src="${imgSrc}" alt="${art.dataset.nume}" style="width:100%;max-height:200px;object-fit:cover;border-radius:0.4rem;margin-bottom:0.8rem">` : ''}
                <table style="width:100%;border-collapse:collapse;font-size:0.88rem">
                    <tr><td class="modal-td-label">Categorie</td><td>${art.className.match(/\b(dama|barbati|accesorii|incaltaminte|bijuterii)\b/)?.[0] || ''}</td></tr>
                    <tr><td class="modal-td-label">Preț</td><td><strong>${parseFloat(art.dataset.pret).toFixed(2)} RON</strong></td></tr>
                    <tr><td class="modal-td-label">Deceniu</td><td>${art.dataset.deceniu}s</td></tr>
                    <tr><td class="modal-td-label">Culoare</td><td>${art.dataset.culoare}</td></tr>
                    <tr><td class="modal-td-label">Materiale</td><td>${(art.dataset.materiale || '').replace(/,/g, ', ')}</td></tr>
                    <tr><td class="modal-td-label">Disponibil</td><td>${disponibil ? '✔ Da' : '✘ Nu'}</td></tr>
                    <tr><td class="modal-td-label">Subcategorie</td><td>${art.dataset.subcategorie || '–'}</td></tr>
                </table>
                <a href="/produse/${art.dataset.id}" style="display:inline-block;margin-top:0.8rem;color:var(--culoare-secundara);font-weight:700">
                    <i class="bi bi-arrow-right-circle-fill"></i> Pagina completă
                </a>`;
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        closeBtn.addEventListener('click', inchideModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) inchideModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') inchideModal(); });

        articles().forEach(art => {
            art.addEventListener('click', e => {
                if (e.target.closest('.btn-produs') || e.target.closest('a')) return;
                deschideModal(art);
            });
        });
    }

    // ── Bonus 4: onchange instant filtering ──────────────────────────────────
    function initOnchange() {
        ['filtru-nume', 'filtru-culoare'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', filtreaza);
        });
        document.getElementById('filtru-pret')?.addEventListener('input', filtreaza);
        document.getElementById('filtru-descriere')?.addEventListener('input', () => {
            const ta = inpTextarea();
            if (ta && ta.value.trim() !== '') ta.classList.remove('is-invalid');
            filtreaza();
        });
        document.getElementById('filtru-subcategorie')?.addEventListener('change', filtreaza);
        document.getElementById('filtru-deceniu')?.addEventListener('change', filtreaza);
        document.querySelectorAll('input[name="filtru-disponibil"]')
            .forEach(r => r.addEventListener('change', filtreaza));
        document.querySelectorAll('.cb-material')
            .forEach(cb => cb.addEventListener('change', filtreaza));
    }

    // ── Event listeners butoane ───────────────────────────────────────────────
    document.getElementById('btn-filtreaza')?.addEventListener('click', filtreaza);
    document.getElementById('btn-sort-asc')?.addEventListener('click', () => sorteaza(false));
    document.getElementById('btn-sort-desc')?.addEventListener('click', () => sorteaza(true));
    document.getElementById('btn-calculeaza')?.addEventListener('click', calculeaza);
    document.getElementById('btn-reset')?.addEventListener('click', reset);

    // ── Init ──────────────────────────────────────────────────────────────────
    initButoaneProdus();
    initModal();
    initOnchange();
    afiseazaPagina(1);
    updateContor();
    updateMesajGol();

})();
