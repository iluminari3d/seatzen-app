import { BATCH_LIMIT, commitInChunks, op } from './batching';

// Finto writeBatch: registra cosa riceve e quando viene inviato
const makeFake = ({ failOnCommit } = {}) => {
    const log = { batches: [], order: [] };
    const createBatch = () => {
        const writes = [];
        const batch = {
            set: (ref, data) => writes.push(['set', ref, data]),
            update: (ref, data) => writes.push(['update', ref, data]),
            delete: (ref) => writes.push(['delete', ref]),
            commit: async () => {
                if (failOnCommit !== undefined && log.batches.length === failOnCommit) throw new Error('commit fallito');
                log.batches.push(writes);
                log.order.push(...writes.map((w) => w[1]));
            },
        };
        return batch;
    };
    return { createBatch, log };
};

const deletes = (n) => Array.from({ length: n }, (_, i) => op.delete(`ref-${i}`));

describe('commitInChunks', () => {
    test('il limite di default è sotto il tetto reale di Firestore (500)', () => {
        expect(BATCH_LIMIT).toBeLessThanOrEqual(500);
    });

    test('poche operazioni: un solo blocco (scrittura atomica)', async () => {
        const { createBatch, log } = makeFake();
        const n = await commitInChunks(createBatch, deletes(10));
        expect(n).toBe(1);
        expect(log.batches).toHaveLength(1);
        expect(log.batches[0]).toHaveLength(10);
    });

    test('nessuna operazione: nessun blocco inviato', async () => {
        const { createBatch, log } = makeFake();
        expect(await commitInChunks(createBatch, [])).toBe(0);
        expect(log.batches).toHaveLength(0);
    });

    test('1000 operazioni vengono spezzate in blocchi che non superano mai il limite', async () => {
        const { createBatch, log } = makeFake();
        const n = await commitInChunks(createBatch, deletes(1000));
        expect(n).toBe(3);
        expect(log.batches.map((b) => b.length)).toEqual([450, 450, 100]);
        expect(Math.max(...log.batches.map((b) => b.length))).toBeLessThanOrEqual(500);
    });

    test('al limite esatto non crea un blocco vuoto in più', async () => {
        const { createBatch, log } = makeFake();
        await commitInChunks(createBatch, deletes(450));
        expect(log.batches.map((b) => b.length)).toEqual([450]);
    });

    test('mantiene l\'ordine delle operazioni, anche tra blocchi diversi', async () => {
        const { createBatch, log } = makeFake();
        const ops = deletes(23);
        await commitInChunks(createBatch, ops, 5);
        expect(log.order).toEqual(ops.map((o) => o.ref));
        expect(log.batches.map((b) => b.length)).toEqual([5, 5, 5, 5, 3]);
    });

    test('passa a Firestore il tipo giusto e i dati', async () => {
        const { createBatch, log } = makeFake();
        await commitInChunks(createBatch, [op.set('a', { x: 1 }), op.update('b', { y: 2 }), op.delete('c')]);
        expect(log.batches[0]).toEqual([['set', 'a', { x: 1 }], ['update', 'b', { y: 2 }], ['delete', 'c']]);
    });

    test('se un blocco fallisce, i successivi non vengono inviati e l\'errore arriva a chi chiama', async () => {
        const { createBatch, log } = makeFake({ failOnCommit: 1 });
        await expect(commitInChunks(createBatch, deletes(12), 5)).rejects.toThrow('commit fallito');
        expect(log.batches).toHaveLength(1);
    });

    test('un tipo di operazione sconosciuto è un errore, non viene ignorato', async () => {
        const { createBatch } = makeFake();
        await expect(commitInChunks(createBatch, [{ type: 'boh', ref: 'x' }])).rejects.toThrow('sconosciuta');
    });

    test('un limite non valido ricade su quello di default', async () => {
        const { createBatch, log } = makeFake();
        await commitInChunks(createBatch, deletes(900), 0);
        expect(log.batches.map((b) => b.length)).toEqual([450, 450]);
    });
});
