import {
    buildNameIndex,
    findSeatingIssues,
    formatSeatingIssues,
    hasMustLinkOutside,
    normalizeName,
    packPeople,
    resolvePreferenceLists,
    summarizeWarnings,
} from './arrangement';

const person = (id, extra = {}) => ({ id, name: id, strictGroupId: '', mustSitWith: [], likes: [], dislikes: [], tableId: null, ...extra });
const people = (n, prefix = 'P') => Array.from({ length: n }, (_, i) => person(`${prefix}${String(i + 1).padStart(2, '0')}`));
const tableOf = (tables, id) => tables.findIndex((t) => t.some((p) => p.id === id));
const sizes = (tables) => tables.map((t) => t.length);

describe('packPeople senza preferenze', () => {
    test('riempie i tavoli in ordine alfabetico, come faceva la vecchia disposizione', () => {
        const { tables, warnings } = packPeople(people(20), 8);
        expect(sizes(tables)).toEqual([8, 8, 4]);
        expect(tables[0].map((p) => p.id)).toEqual(people(8).map((p) => p.id));
        expect(warnings).toEqual([]);
    });

    test('lista vuota e capacità non valida non rompono nulla', () => {
        expect(packPeople([], 8).tables).toEqual([]);
        expect(sizes(packPeople(people(3), 0).tables)).toEqual([1, 1, 1]);
        expect(sizes(packPeople(people(3), 'x').tables)).toEqual([1, 1, 1]);
    });

    test('non modifica l\'array in ingresso', () => {
        const input = people(10);
        const copy = [...input];
        packPeople(input, 4);
        expect(input).toEqual(copy);
    });
});

describe('packPeople con preferenze', () => {
    test('"deve sedersi con" tiene insieme le persone, anche se lontane in ordine alfabetico', () => {
        const list = [...people(15), person('ZZ-Marco', { mustSitWith: ['P01'] })];
        const { tables } = packPeople(list, 8);
        expect(tableOf(tables, 'ZZ-Marco')).toBe(tableOf(tables, 'P01'));
    });

    test('il vincolo vale anche se è dichiarato da una sola parte', () => {
        const list = [person('Anna'), person('Zeno', { mustSitWith: ['Anna'] }), ...people(14)];
        const { tables } = packPeople(list, 8);
        expect(tableOf(tables, 'Anna')).toBe(tableOf(tables, 'Zeno'));
    });

    test('il gruppo stretto resta insieme se sta in un tavolo', () => {
        const family = ['Rossi-1', 'Rossi-2', 'Rossi-3', 'Rossi-4', 'Rossi-5'].map((id) => person(id, { strictGroupId: 'g1' }));
        const { tables, warnings } = packPeople([...people(12), ...family], 8);
        expect(new Set(family.map((p) => tableOf(tables, p.id))).size).toBe(1);
        expect(warnings).toEqual([]);
    });

    test('"non vuole sedersi con" separa le persone quando esiste un\'alternativa', () => {
        const list = [person('Anna', { dislikes: ['Bruno'] }), person('Bruno'), ...people(10)];
        const { tables, warnings } = packPeople(list, 8);
        expect(tableOf(tables, 'Anna')).not.toBe(tableOf(tables, 'Bruno'));
        expect(warnings).toEqual([]);
    });

    test('il conflitto vale anche se dichiarato dall\'altra parte', () => {
        const list = [person('Anna'), person('Bruno', { dislikes: ['Anna'] }), ...people(10)];
        const { tables } = packPeople(list, 8);
        expect(tableOf(tables, 'Anna')).not.toBe(tableOf(tables, 'Bruno'));
    });

    test('"vuole sedersi con" avvicina le persone', () => {
        // Senza preferenze Carla (C) e Sara (S) finirebbero in tavoli diversi (ordine alfabetico, capacità 2)
        const list = [person('A1'), person('B1'), person('Carla', { likes: ['Sara'] }), person('D1'), person('E1'), person('Sara')];
        const { tables } = packPeople(list, 2);
        expect(tableOf(tables, 'Carla')).toBe(tableOf(tables, 'Sara'));
    });

    test('un gruppo più grande del tavolo viene diviso e segnalato', () => {
        const family = Array.from({ length: 11 }, (_, i) => person(`F${String(i + 1).padStart(2, '0')}`, { strictGroupId: 'big' }));
        const { tables, warnings } = packPeople([...family, ...people(3)], 8);
        expect(tables.every((t) => t.length <= 8)).toBe(true);
        expect(warnings.filter((w) => w.type === 'split')).toHaveLength(1);
        expect(warnings[0].size).toBe(11);
    });

    test('se due persone che si evitano sono nello stesso gruppo legato, lo segnala', () => {
        const list = [
            person('Anna', { strictGroupId: 'g', dislikes: ['Bruno'] }),
            person('Bruno', { strictGroupId: 'g' }),
        ];
        const { tables, warnings } = packPeople(list, 8);
        expect(tables).toHaveLength(1);
        expect(warnings).toEqual([{ type: 'conflict', a: 'Anna', b: 'Bruno' }]);
    });

    test('un conflitto non evitabile apre un tavolo in più invece di unire le persone', () => {
        const list = [person('A', { dislikes: ['B'] }), person('B')];
        expect(sizes(packPeople(list, 8).tables)).toEqual([1, 1]);
    });

    test('un riferimento a una persona non presente nella lista viene ignorato', () => {
        const list = [person('A', { mustSitWith: ['fantasma'], likes: ['fantasma'], dislikes: ['fantasma'] }), person('B')];
        expect(sizes(packPeople(list, 8).tables)).toEqual([2]);
    });
});

describe('packPeople: proprietà su input casuali', () => {
    // Generatore pseudo-casuale con seme fisso, così il test è ripetibile
    const rng = (seed) => () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };

    test('ognuno è seduto una volta sola, nessun tavolo supera la capacità, i conflitti segnalati sono veri', () => {
        for (let trial = 0; trial < 200; trial++) {
            const rand = rng(trial + 1);
            const n = 1 + Math.floor(rand() * 60);
            const cap = 1 + Math.floor(rand() * 10);
            const list = people(n);
            list.forEach((p) => {
                if (rand() < 0.15) p.strictGroupId = `g${Math.floor(rand() * 4)}`;
                const pick = () => list[Math.floor(rand() * n)].id;
                if (rand() < 0.2) p.mustSitWith.push(pick());
                if (rand() < 0.3) p.likes.push(pick());
                if (rand() < 0.2) p.dislikes.push(pick());
            });

            const { tables, warnings } = packPeople(list, cap);
            const seated = tables.flat().map((p) => p.id);
            expect(new Set(seated).size).toBe(n);
            expect(seated).toHaveLength(n);
            tables.forEach((t) => expect(t.length).toBeLessThanOrEqual(cap));

            // ogni coppia "si evitano" allo stesso tavolo deve essere stata segnalata
            const reported = new Set(warnings.filter((w) => w.type === 'conflict').map((w) => [w.a, w.b].sort().join('|')));
            tables.forEach((t) => {
                for (let i = 0; i < t.length; i++) {
                    for (let j = i + 1; j < t.length; j++) {
                        const bad = t[i].dislikes.includes(t[j].id) || t[j].dislikes.includes(t[i].id);
                        if (bad) expect(reported.has([t[i].id, t[j].id].sort().join('|'))).toBe(true);
                    }
                }
            });
        }
    });
});

describe('nomi e risoluzione delle preferenze (import CSV)', () => {
    const index = buildNameIndex([
        { id: 'a', name: 'Anna Verdi' },
        { id: 'b', name: 'Zoë  Rossi' },
        { id: 'c', name: 'Luca Neri' },
        { id: 'd1', name: 'Mario Bianchi' },
        { id: 'd2', name: 'mario bianchi' },
    ]);

    test('normalizeName ignora maiuscole, accenti e spazi', () => {
        expect(normalizeName('  Zoë   ROSSI ')).toBe('zoe rossi');
        expect(normalizeName(null)).toBe('');
    });

    test('risolve più nomi separati da punto e virgola, senza badare a maiuscole e accenti', () => {
        const r = resolvePreferenceLists({ mustSitWithRaw: 'anna verdi; ZOE ROSSI', likesRaw: '', dislikesRaw: '' }, index, 'x');
        expect(r.mustSitWith).toEqual(['a', 'b']);
        expect(r.unresolved).toEqual([]);
    });

    test('segnala nomi non trovati e nomi ambigui, senza indovinare', () => {
        const r = resolvePreferenceLists({ mustSitWithRaw: '', likesRaw: 'Paolo Gialli;Mario Bianchi;Luca Neri', dislikesRaw: '' }, index, 'x');
        expect(r.likes).toEqual(['c']);
        expect(r.unresolved).toEqual([
            { name: 'Paolo Gialli', reason: 'non trovato' },
            { name: 'Mario Bianchi', reason: 'nome ambiguo' },
        ]);
    });

    test('ignora se stesso e i doppioni', () => {
        const r = resolvePreferenceLists({ mustSitWithRaw: 'Anna Verdi;Anna Verdi;Luca Neri', likesRaw: '', dislikesRaw: '' }, index, 'a');
        expect(r.mustSitWith).toEqual(['c']);
    });

    test('in caso di contraddizione vince "deve sedersi con", poi "non vuole", poi "vuole"', () => {
        const r = resolvePreferenceLists(
            { mustSitWithRaw: 'Anna Verdi', likesRaw: 'Anna Verdi;Luca Neri;Zoë Rossi', dislikesRaw: 'Anna Verdi;Luca Neri' },
            index,
            'x'
        );
        expect(r.mustSitWith).toEqual(['a']);
        expect(r.dislikes).toEqual(['c']);
        expect(r.likes).toEqual(['b']);
    });

    test('celle vuote o mancanti non producono nulla', () => {
        const r = resolvePreferenceLists({}, index, 'x');
        expect(r).toEqual({ mustSitWith: [], likes: [], dislikes: [], unresolved: [] });
    });
});

describe('controlli nel drag-and-drop', () => {
    const seated = [
        person('Anna', { tableId: 't1', dislikes: ['Bruno'] }),
        person('Carlo', { tableId: 't1' }),
        person('Bruno', { tableId: 't2' }),
        person('Dora', { tableId: 't2', mustSitWith: ['Carlo'] }),
        person('Elio', { tableId: null }),
    ];

    test('avvisa se si mette qualcuno con chi non vuole', () => {
        const bruno = seated[2];
        const issues = findSeatingIssues(bruno, 't1', seated);
        expect(issues.dislikes).toEqual(['Anna']);
        expect(formatSeatingIssues(bruno, issues)).toContain('Bruno non vuole sedersi con: Anna');
    });

    test('avvisa se si separa chi deve sedersi insieme', () => {
        const dora = seated[3];
        expect(findSeatingIssues(dora, 't2', seated).mustApart).toEqual(['Carlo']);
        expect(findSeatingIssues(dora, 't1', seated).mustApart).toEqual([]);
    });

    test('nessun avviso se non ci sono problemi, e chi non è seduto non conta', () => {
        const elio = seated[4];
        const issues = findSeatingIssues(elio, 't1', seated);
        expect(issues).toEqual({ dislikes: [], mustApart: [] });
        expect(formatSeatingIssues(elio, issues)).toBe('');
        expect(findSeatingIssues(seated[1], 't2', [...seated.slice(0, 3), person('Dora', { tableId: null, mustSitWith: ['Carlo'] })]).mustApart).toEqual([]);
    });
});

describe('esenzione dal tavolo bambini', () => {
    test('un bambino legato a un adulto da "deve sedersi con" è fuori dal gruppo bambini', () => {
        const kid = person('Kid', { mustSitWith: ['Mamma'] });
        const mamma = person('Mamma');
        const kid2 = person('Kid2');
        const all = [kid, mamma, kid2];
        const kidIds = new Set(['Kid', 'Kid2']);
        expect(hasMustLinkOutside(kid, all, kidIds)).toBe(true);
        expect(hasMustLinkOutside(kid2, all, kidIds)).toBe(false);
    });

    test('vale anche se il legame è dichiarato dall\'adulto', () => {
        const kid = person('Kid');
        const papa = person('Papa', { mustSitWith: ['Kid'] });
        expect(hasMustLinkOutside(kid, [kid, papa], new Set(['Kid']))).toBe(true);
    });
});

describe('messaggi di riepilogo', () => {
    test('nessun avviso, nessun messaggio', () => {
        expect(summarizeWarnings([])).toEqual([]);
    });

    test('descrive gruppi divisi e conflitti', () => {
        const lines = summarizeWarnings([
            { type: 'split', size: 11, capacity: 8, names: ['F01', 'F02'] },
            { type: 'conflict', a: 'Anna', b: 'Bruno' },
        ]);
        expect(lines).toHaveLength(2);
        expect(lines[0]).toContain('più grande di un tavolo');
        expect(lines[0]).toContain('F01 e altri (11 persone)');
        expect(lines[1]).toContain('Anna e Bruno');
    });

    test('con molti conflitti ne mostra cinque e conta gli altri', () => {
        const many = Array.from({ length: 8 }, (_, i) => ({ type: 'conflict', a: `A${i}`, b: `B${i}` }));
        expect(summarizeWarnings(many)[0]).toContain('e altre 3 coppie');
    });
});

describe('"vuole sedersi con": casi limite', () => {
    test('non unisce persone che si evitano, anche se una terza le desidera entrambe', () => {
        const list = [
            person('A', { likes: ['B', 'C'] }),
            person('B', { dislikes: ['C'] }),
            person('C'),
        ];
        const { tables, warnings } = packPeople(list, 3);
        expect(tableOf(tables, 'B')).not.toBe(tableOf(tables, 'C'));
        expect(warnings).toEqual([]);
    });

    test('i legami reciproci hanno la precedenza su quelli a senso unico', () => {
        // Con capacità 2: A vuole B (a senso unico), ma B e C si vogliono a vicenda
        const list = [person('A', { likes: ['B'] }), person('B', { likes: ['C'] }), person('C', { likes: ['B'] })];
        const { tables } = packPeople(list, 2);
        expect(tableOf(tables, 'B')).toBe(tableOf(tables, 'C'));
        expect(tableOf(tables, 'A')).not.toBe(tableOf(tables, 'B'));
    });

    test('una catena di desideri più lunga del tavolo non supera mai la capacità', () => {
        const chain = Array.from({ length: 12 }, (_, i) => person(`C${String(i + 1).padStart(2, '0')}`, { likes: [`C${String(i + 2).padStart(2, '0')}`] }));
        const { tables } = packPeople(chain, 5);
        expect(tables.flat()).toHaveLength(12);
        tables.forEach((t) => expect(t.length).toBeLessThanOrEqual(5));
    });
});
