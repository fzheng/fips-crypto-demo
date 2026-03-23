/** Key exchange session states */
export type SessionStatus = 'none' | 'ke-initiated' | 'ke-responded' | 'established';

/**
 * State machine for a key exchange session with a peer.
 *
 * Transitions:
 *   NONE → KE_INITIATED:   Initiator sends ke-init
 *   NONE → KE_RESPONDED:   Responder receives ke-init, sends ke-response
 *   KE_INITIATED → ESTABLISHED: Initiator receives ke-response, derives key
 *   KE_RESPONDED → ESTABLISHED: Already derived on response
 */
export function nextStatus(
  current: SessionStatus,
  event: 'initiate' | 'respond' | 'complete',
): SessionStatus {
  switch (event) {
    case 'initiate':
      return 'ke-initiated';
    case 'respond':
      return 'established'; // responder derives key immediately
    case 'complete':
      return current === 'ke-initiated' ? 'established' : current;
    default:
      return current;
  }
}
