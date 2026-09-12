export type SavingsVehicleType = 'flexible' | 'term' | 'goal';

export type SavingsVehicle = {
  id: string;
  name: string;
  vehicleType: SavingsVehicleType;
  balance: number;
  monthlyGrowth: number;
  annualYieldPercent: number;
};

const VEHICLE_TYPE_DEFAULT_YIELD: Record<SavingsVehicleType, number> = {
  flexible: 4.5,
  term: 11.0,
  goal: 6.1,
};

const MOCK_NETWORK_DELAY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_NETWORK_DELAY_MS);
  });
}

/**
 * TODO(add-savings-management): stand-in for the real savings-vehicle
 * resource. `openspec/changes/add-savings-management/tasks.md` §1 (backend
 * coordination) is still unresolved — whether "Mis Ahorros" is the same
 * resource as `saving_bags` (REQ-BAG-*) or a superset — so this mocks an
 * independent resource instead of guessing at that shape, matching the fixed
 * mock-list style of `src/features/session/mockAccounts.ts`. Replace with
 * real `src/api/types.ts` / `endpoints.ts` wiring once that's confirmed;
 * `openspec/WORKFLOW.md` scopes this build pass to UI + mocked data only.
 */
const INITIAL_SAVINGS: SavingsVehicle[] = [
  {
    id: 'sv-1',
    name: 'Ahorro Flexible',
    vehicleType: 'flexible',
    balance: 28450.0,
    monthlyGrowth: 120.5,
    annualYieldPercent: 4.5,
  },
  {
    id: 'sv-2',
    name: 'Inversión a Plazo Fijo',
    vehicleType: 'term',
    balance: 15000.0,
    monthlyGrowth: 450.2,
    annualYieldPercent: 11.0,
  },
  {
    id: 'sv-3',
    name: 'Meta Vacaciones',
    vehicleType: 'goal',
    balance: 1780.5,
    monthlyGrowth: 14.1,
    annualYieldPercent: 6.1,
  },
];

/** Simulated GET, standing in for the real endpoint so the screen can still use TanStack Query's fetch/cache pattern (tasks.md §2.3). */
export function fetchMockSavings(): Promise<SavingsVehicle[]> {
  return delay([...INITIAL_SAVINGS]);
}

export type CreateSavingsInput = {
  name: string;
  vehicleType: SavingsVehicleType;
  initialAmount?: number;
};

/** Simulated POST — never reaches a backend; the caller merges the result into query cache/local state. */
export function createMockSavingsVehicle(input: CreateSavingsInput): Promise<SavingsVehicle> {
  return delay({
    id: `sv-${Date.now()}`,
    name: input.name,
    vehicleType: input.vehicleType,
    balance: input.initialAmount ?? 0,
    monthlyGrowth: 0,
    annualYieldPercent: VEHICLE_TYPE_DEFAULT_YIELD[input.vehicleType],
  });
}

export type ContributeInput = { vehicleId: string; amount: number };

/** Simulated top-up ("Aportar fondos") — SPECS.md §12 excludes real payment rails, so this only ever mutates local mock state. */
export function contributeMockFunds(input: ContributeInput): Promise<ContributeInput> {
  return delay(input);
}

/** Matches the Figma reference: no currency symbol from Intl, "MXN" is rendered as a separate label. */
export function formatMXN(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
