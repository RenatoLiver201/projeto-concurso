/**
 * Junta nomes de classe CSS ignorando valores falsos.
 */
export const cn = (...a) => a.filter(Boolean).join(" ");
