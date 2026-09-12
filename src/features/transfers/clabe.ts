export type ClabeValidation = { valid: boolean; error?: string };

/**
 * Requires the full 18-digit CLABE with a valid mod-10 checksum (weights
 * 3-7-1 repeating) — the same algorithm the backend re-validates server-side
 * (`amitie/backend/mcp_servers/finance/clabe.py::is_valid_clabe`), since the
 * new form explicitly asks for "CLABE" plus a separate "banco" field. The
 * previous 10-17 digit plain-account-number fallback is intentionally
 * dropped: a real bank-transfer form that also asks which bank the account
 * belongs to doesn't accept an unchecksummed bare account number.
 */
export function validateClabe(raw: string): ClabeValidation {
  const digitsOnly = raw.trim();

  if (!digitsOnly) {
    return { valid: false, error: 'Ingresa una CLABE.' };
  }
  if (!/^\d+$/.test(digitsOnly)) {
    return { valid: false, error: 'Solo se permiten dígitos.' };
  }
  if (digitsOnly.length !== 18) {
    return { valid: false, error: 'La CLABE debe tener 18 dígitos.' };
  }
  if (!hasValidClabeChecksum(digitsOnly)) {
    return { valid: false, error: 'La CLABE no es válida (dígito verificador incorrecto).' };
  }

  return { valid: true };
}

function hasValidClabeChecksum(clabe: string): boolean {
  const weights = [3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (Number(clabe[i]) * weights[i % 3]) % 10;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(clabe[17]);
}

export function maskAccountNumber(accountNumber: string): string {
  return `**** ${accountNumber.slice(-4)}`;
}
