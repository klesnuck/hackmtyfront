/**
 * Error-code convention: `ERR_<AREA>_<NUMBER>` (matches Figma's example
 * `ERR_09_023`, node 37:351). AREA is a short uppercase tag for the failing
 * subsystem (SESSION, NETWORK, SERVER, ...); NUMBER is a zero-padded,
 * per-area sequence, so a newly discovered failure mode in an existing area
 * gets the next number in that area instead of colliding with an unrelated
 * one elsewhere. Each code maps to the default heading + message
 * `ErrorScreen` shows for it — see `openspec/changes/add-error-screen`'s
 * spec (`mobile/error-screen`, "Error codes are specific, not generic") for
 * why every failure category gets its own code instead of one catch-all:
 * the "Contáctanos" path and support triage need something concrete to go
 * on when two different underlying failures show up as two different codes.
 */

export type ErrorCopy = {
  /** The 22px bold line under "¡Oops!" — what went wrong, in a few words. */
  heading: string;
  /** The 15px description line — what the user can do about it, if anything. */
  message: string;
};

export const errorCodes = {
  ERR_SESSION_001: {
    heading: 'No pudimos iniciar tu sesión',
    message: 'Hubo un problema al preparar tu sesión. Intenta de nuevo en unos segundos.',
  },
  ERR_NETWORK_001: {
    heading: 'Sin conexión',
    message: 'No pudimos conectarnos al servidor. Revisa tu conexión a internet e intenta de nuevo.',
  },
  ERR_SERVER_001: {
    heading: 'Ocurrió un error inesperado',
    message: 'Lo sentimos, algo salió mal. Por favor intenta de nuevo.',
  },
} as const satisfies Record<string, ErrorCopy>;

export type KnownErrorCode = keyof typeof errorCodes;

const fallbackCopy: ErrorCopy = errorCodes.ERR_SERVER_001;

/**
 * Looks up the default copy for a code. Falls back to the generic
 * server-error copy for a code that isn't (yet) in the registry above, so
 * `ErrorScreen` never renders blank heading/message text for a code a
 * caller invented ahead of registering it here.
 */
export function getErrorCopy(code: string): ErrorCopy {
  return (errorCodes as Record<string, ErrorCopy>)[code] ?? fallbackCopy;
}
