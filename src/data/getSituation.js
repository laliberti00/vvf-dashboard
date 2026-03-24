import { COL, SOGLIE } from './constants';

/**
 * UNICA FONTE DI VERITÀ per la classificazione operativa di una sede.
 *
 * Regole (in ordine di priorità):
 *   1. Tecnologia LTE  → EMERGENZA  (collegamento di ultima istanza)
 *   2. Saturazione ≥ sat_emergenza%  → EMERGENZA
 *   3. Tecnologia DSL  → DEGRADATO  (collegamento di backup)
 *   4. Saturazione ≥ sat_degradato%  → DEGRADATO
 *   5. Altrimenti       → OPERATIVO
 *
 * @param {string} tipo  - 'Fibra' | 'DSL' | 'LTE'
 * @param {number} sat   - saturazione percentuale (0-100)
 * @returns {'OPERATIVO'|'DEGRADATO'|'EMERGENZA'}
 */
export function getSituation(tipo, sat) {
  if (tipo === 'LTE' || sat >= SOGLIE.sat_emergenza) return 'EMERGENZA';
  if (tipo === 'DSL' || sat >= SOGLIE.sat_degradato)  return 'DEGRADATO';
  return 'OPERATIVO';
}

/** Colore bordo/stroke per la situazione */
export function sitStroke(sit) {
  return sit === 'EMERGENZA' ? COL.critStroke
       : sit === 'DEGRADATO' ? COL.warnStroke
       : COL.okStroke;
}

/** Colore riempimento (più chiaro) per la situazione */
export function sitFill(sit) {
  return sit === 'EMERGENZA' ? COL.critical
       : sit === 'DEGRADATO' ? COL.warning
       : COL.ok;
}
