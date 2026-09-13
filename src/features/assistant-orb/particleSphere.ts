export type Vec3 = { x: number; y: number; z: number };

/**
 * Evenly distributes `count` points on the surface of a unit sphere using a
 * Fibonacci (golden-angle) spiral — cheap, deterministic, and avoids the
 * clumping at the poles that random sampling produces.
 */
export function fibonacciSphere(count: number): Vec3[] {
  const pts: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2; // 1 -> -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return pts;
}

function hexToRgb(hex: string) {
  'worklet';
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const bigint = parseInt(full, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

/** Linear RGB mix between two hex colors, `t` clamped to 0..1. Runs on the UI thread. */
export function mixColor(hexA: string, hexB: string, t: number) {
  'worklet';
  const clamped = Math.max(0, Math.min(1, t));
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}
