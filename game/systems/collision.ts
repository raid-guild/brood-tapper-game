// Collision in lane space is interval overlap on a line (plan §4).

export function overlaps(
  aCenter: number,
  aWidth: number,
  bCenter: number,
  bWidth: number
): boolean {
  return Math.abs(aCenter - bCenter) < (aWidth + bWidth) / 2;
}
