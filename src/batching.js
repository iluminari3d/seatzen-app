// --- Scritture Firestore a blocchi ---
// Un writeBatch di Firestore accetta al massimo 500 operazioni: con centinaia di invitati, "Svuota lista",
// l'importazione, il reset e l'eliminazione di un evento fallirebbero. Qui le operazioni vengono descritte
// come semplici oggetti e inviate a blocchi, in ordine.
//
// Attenzione: se tutte le operazioni stanno in un solo blocco la scrittura è atomica; se servono più blocchi
// NON lo è. Per questo l'ordine conta: chi chiama deve mettere per ultime le cancellazioni di ciò a cui altri
// documenti fanno riferimento (es. i tavoli), così un errore a metà non lascia riferimenti a documenti spariti.

// Il limite reale è 500: si resta più bassi per prudenza.
export const BATCH_LIMIT = 450;

export const op = {
    set: (ref, data) => ({ type: 'set', ref, data }),
    update: (ref, data) => ({ type: 'update', ref, data }),
    delete: (ref) => ({ type: 'delete', ref }),
};

// createBatch: () => writeBatch(db). Restituisce il numero di blocchi inviati.
export const commitInChunks = async (createBatch, operations, limit = BATCH_LIMIT) => {
    const size = Math.max(1, Math.floor(Number(limit)) || BATCH_LIMIT);
    let committed = 0;
    for (let i = 0; i < operations.length; i += size) {
        const batch = createBatch();
        operations.slice(i, i + size).forEach((operation) => {
            if (operation.type === 'set') batch.set(operation.ref, operation.data);
            else if (operation.type === 'update') batch.update(operation.ref, operation.data);
            else if (operation.type === 'delete') batch.delete(operation.ref);
            else throw new Error(`Operazione di scrittura sconosciuta: ${operation.type}`);
        });
        await batch.commit();
        committed++;
    }
    return committed;
};
