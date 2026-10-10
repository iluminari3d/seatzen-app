// --- Logica di disposizione e preferenze (funzioni pure, senza React né Firebase) ---
// Ogni persona ha: { id, name, strictGroupId, mustSitWith: [id], likes: [id], dislikes: [id], tableId }.
// Le relazioni vengono lette in modo simmetrico: se A "non vuole sedersi con" B, il vincolo vale anche per B.

const byName = (a, b) => (a.name || '').localeCompare(b.name || '', 'it');

const includes = (list, id) => Array.isArray(list) && list.includes(id);

const inConflict = (a, b) => includes(a.dislikes, b.id) || includes(b.dislikes, a.id);

const likeScore = (a, b) => (includes(a.likes, b.id) ? 1 : 0) + (includes(b.likes, a.id) ? 1 : 0);

const isMustLinked = (a, b) => includes(a.mustSitWith, b.id) || includes(b.mustSitWith, a.id);

// --- NOMI -------------------------------------------------------------------

// Confronto tollerante: ignora maiuscole, accenti e spazi multipli ("  Zoë  Rossi" == "zoe rossi").
export const normalizeName = (name) =>
    String(name ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

// Indice nome normalizzato -> id. Un nome che compare più volte è ambiguo e vale null: non si indovina.
export const buildNameIndex = (people) => {
    const index = new Map();
    people.forEach((p) => {
        const key = normalizeName(p.name);
        if (!key) return;
        index.set(key, index.has(key) ? null : p.id);
    });
    return index;
};

const splitNames = (raw) => String(raw ?? '').split(';').map((s) => s.trim()).filter(Boolean);

// Trasforma i nomi del CSV ("Anna Verdi;Luca Verdi") in id. Priorità in caso di contraddizioni:
// "deve sedersi con" > "non vuole" > "vuole". Restituisce anche i nomi che non si è riusciti a collegare.
export const resolvePreferenceLists = ({ mustSitWithRaw, likesRaw, dislikesRaw }, nameIndex, ownId) => {
    const unresolved = [];
    const resolve = (raw) => {
        const ids = [];
        splitNames(raw).forEach((name) => {
            const id = nameIndex.get(normalizeName(name));
            if (id === undefined) unresolved.push({ name, reason: 'non trovato' });
            else if (id === null) unresolved.push({ name, reason: 'nome ambiguo' });
            else if (id !== ownId && !ids.includes(id)) ids.push(id);
        });
        return ids;
    };
    const mustSitWith = resolve(mustSitWithRaw);
    const dislikes = resolve(dislikesRaw).filter((id) => !mustSitWith.includes(id));
    const likes = resolve(likesRaw).filter((id) => !mustSitWith.includes(id) && !dislikes.includes(id));
    return { mustSitWith, likes, dislikes, unresolved };
};

// --- CLUSTER ----------------------------------------------------------------

// Raggruppa chi deve stare insieme: "deve sedersi con" (anche in una sola direzione) e stesso gruppo stretto.
const buildClusters = (people) => {
    const parent = people.map((_, i) => i);
    const find = (i) => {
        while (parent[i] !== i) {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        return i;
    };
    const union = (i, j) => {
        const ri = find(i);
        const rj = find(j);
        if (ri !== rj) parent[Math.max(ri, rj)] = Math.min(ri, rj);
    };

    const indexById = new Map(people.map((p, i) => [p.id, i]));
    people.forEach((p, i) => {
        (p.mustSitWith || []).forEach((id) => {
            const j = indexById.get(id);
            if (j !== undefined) union(i, j);
        });
    });
    const firstOfGroup = new Map();
    people.forEach((p, i) => {
        if (!p.strictGroupId) return;
        if (firstOfGroup.has(p.strictGroupId)) union(i, firstOfGroup.get(p.strictGroupId));
        else firstOfGroup.set(p.strictGroupId, i);
    });

    const clusters = new Map();
    people.forEach((p, i) => {
        const root = find(i);
        if (!clusters.has(root)) clusters.set(root, []);
        clusters.get(root).push(p);
    });
    return [...clusters.values()].map((members) => members.sort(byName));
};

// --- IMPACCHETTAMENTO -------------------------------------------------------

// Distribuisce le persone in tavoli di capacità `capacity`.
// - chi è legato (deve sedersi con / stesso gruppo stretto) resta insieme, se il gruppo sta in un tavolo;
// - chi non si sopporta non viene messo allo stesso tavolo finché esiste un'alternativa;
// - tra i tavoli possibili si preferisce quello con più "vuole sedersi con", poi il più pieno.
// Non modifica l'array in ingresso. Restituisce { tables: [[persona]], warnings: [...] }.
export const packPeople = (people, capacity) => {
    const cap = Math.max(1, Math.floor(Number(capacity)) || 1);
    const warnings = [];

    // Cluster troppo grandi per un tavolo: spezzati in blocchi interi + un resto
    const pieces = [];
    buildClusters(people).forEach((cluster) => {
        if (cluster.length <= cap) {
            pieces.push(cluster);
            return;
        }
        warnings.push({ type: 'split', size: cluster.length, capacity: cap, names: cluster.map((p) => p.name) });
        for (let i = 0; i < cluster.length; i += cap) pieces.push(cluster.slice(i, i + cap));
    });
    // "Vuole sedersi con" è un legame morbido: unisce i blocchi solo se stanno in un tavolo e non contengono conflitti.
    // Prima i legami reciproci, poi quelli a senso unico. Senza questo passo, i tavoli si riempirebbero di altre persone
    // prima che arrivi quella desiderata.
    const pieceOf = new Map();
    pieces.forEach((piece, i) => piece.forEach((p) => pieceOf.set(p.id, i)));
    const edges = [];
    pieces.forEach((piece, i) =>
        piece.forEach((p) =>
            (p.likes || []).forEach((id) => {
                const j = pieceOf.get(id);
                if (j === undefined || j === i) return;
                const other = pieces[j].find((q) => q.id === id);
                edges.push({ i, j, mutual: includes(other.likes, p.id), key: `${p.name}|${other.name}` });
            })
        )
    );
    edges.sort((a, b) => Number(b.mutual) - Number(a.mutual) || a.key.localeCompare(b.key, 'it'));

    const owner = pieces.map((_, i) => i);
    const findOwner = (i) => {
        while (owner[i] !== i) {
            owner[i] = owner[owner[i]];
            i = owner[i];
        }
        return i;
    };
    const blocks = pieces.map((piece) => [...piece]);
    edges.forEach(({ i, j }) => {
        const ri = findOwner(i);
        const rj = findOwner(j);
        if (ri === rj) return;
        if (blocks[ri].length + blocks[rj].length > cap) return;
        if (blocks[ri].some((p) => blocks[rj].some((q) => inConflict(p, q)))) return;
        owner[rj] = ri;
        blocks[ri] = blocks[ri].concat(blocks[rj]);
        blocks[rj] = [];
    });

    const merged = blocks.filter((block) => block.length > 0).map((block) => block.sort(byName));
    merged.sort((a, b) => b.length - a.length || byName(a[0], b[0]));

    const tables = [];
    merged.forEach((piece) => {
        let best = -1;
        let bestScore = -Infinity;
        let bestFill = -1;
        tables.forEach((table, ti) => {
            if (table.length + piece.length > cap) return;
            if (piece.some((p) => table.some((q) => inConflict(p, q)))) return;
            const score = piece.reduce((sum, p) => sum + table.reduce((s, q) => s + likeScore(p, q), 0), 0);
            if (score > bestScore || (score === bestScore && table.length > bestFill)) {
                best = ti;
                bestScore = score;
                bestFill = table.length;
            }
        });
        if (best === -1) tables.push([...piece]);
        else tables[best].push(...piece);
    });

    // Coppie che non volevano stare insieme ma ci sono finite (solo se inevitabile: stesso gruppo legato o cluster spezzato)
    tables.forEach((table) => {
        for (let i = 0; i < table.length; i++) {
            for (let j = i + 1; j < table.length; j++) {
                if (inConflict(table[i], table[j])) warnings.push({ type: 'conflict', a: table[i].name, b: table[j].name });
            }
        }
    });

    return { tables: tables.map((t) => [...t].sort(byName)), warnings };
};

// Vero se `person` ha un legame "deve sedersi con" (in qualunque direzione) con qualcuno fuori da `groupIds`.
export const hasMustLinkOutside = (person, allPeople, groupIds) =>
    allPeople.some((other) => other.id !== person.id && !groupIds.has(other.id) && isMustLinked(person, other));

// --- MESSAGGI ---------------------------------------------------------------

export const summarizeWarnings = (warnings) => {
    const lines = [];
    const splits = warnings.filter((w) => w.type === 'split');
    if (splits.length > 0) {
        const labels = splits.slice(0, 3).map((w) => `${w.names[0]} e altri (${w.size} persone)`).join('; ');
        lines.push(
            splits.length === 1
                ? `Un gruppo legato è più grande di un tavolo ed è stato diviso su più tavoli: ${labels}.`
                : `${splits.length} gruppi legati sono più grandi di un tavolo e sono stati divisi su più tavoli: ${labels}.`
        );
    }
    const conflicts = warnings.filter((w) => w.type === 'conflict');
    if (conflicts.length > 0) {
        const pairs = conflicts.slice(0, 5).map((w) => `${w.a} e ${w.b}`).join('; ');
        const more = conflicts.length > 5 ? ` (e altre ${conflicts.length - 5} coppie)` : '';
        lines.push(`Queste persone non volevano sedersi insieme ma sono allo stesso tavolo perché legate allo stesso gruppo: ${pairs}${more}.`);
    }
    return lines;
};

// Controlli prima di spostare `person` su un tavolo (drag-and-drop).
export const findSeatingIssues = (person, destTableId, people) => {
    const atDest = people.filter((p) => p.tableId === destTableId && p.id !== person.id);
    const dislikes = atDest.filter((p) => inConflict(person, p)).map((p) => p.name);
    const mustApart = people
        .filter((p) => p.id !== person.id && isMustLinked(person, p) && p.tableId && p.tableId !== destTableId)
        .map((p) => p.name);
    return { dislikes, mustApart };
};

export const formatSeatingIssues = (person, { dislikes, mustApart }) => {
    const lines = [];
    if (dislikes.length > 0) lines.push(`${person.name} non vuole sedersi con: ${dislikes.join(', ')}.`);
    if (mustApart.length > 0) lines.push(`${person.name} deve sedersi con ${mustApart.join(', ')}, che è a un altro tavolo.`);
    return lines.join('\n');
};
