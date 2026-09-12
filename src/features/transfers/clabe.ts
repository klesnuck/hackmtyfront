export type AccountValidation = { valid: boolean; error?: string };

/**
 * Syntactic-only validation (`add-transfers` design.md non-goal: no real
 * banking-network lookup). Accepts either a plain account number (10-17
 * digits) or a full 18-digit CLABE, in which case the standard mod-10
 * checksum (weights 3-7-1 repeating) is also checked.
 */
export function validateAccountNumber(raw: string): AccountValidation {
  const digitsOnly = raw.trim();

  if (!digitsOnly) {
    return { valid: false, error: 'Ingresa una CLABE o número de cuenta.' };
  }
  if (!/^\d+$/.test(digitsOnly)) {
    return { valid: false, error: 'Solo se permiten dígitos.' };
  }
  if (digitsOnly.length < 10 || digitsOnly.length > 18) {
    return { valid: false, error: 'Debe tener entre 10 y 18 dígitos.' };
  }
  if (digitsOnly.length === 18 && !hasValidClabeChecksum(digitsOnly)) {
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
