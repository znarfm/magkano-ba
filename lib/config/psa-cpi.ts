/**
 * Philippine Statistics Authority (PSA) Consumer Price Index (CPI) annual averages (2018 = 100 base).
 * Used for inflation adjustments scaling nominal historical salaries to 2026 purchasing power.
 */
export const PSA_CPI_SERIES: Record<number, number> = {
  2005: 57.0,
  2006: 60.5,
  2007: 62.3,
  2008: 67.4,
  2009: 70.2,
  2010: 72.9,
  2011: 76.3,
  2012: 78.7,
  2013: 81.0,
  2014: 83.9,
  2015: 84.5,
  2016: 85.6,
  2017: 88.1,
  2018: 100.0,
  2019: 102.5,
  2020: 105.2,
  2021: 109.3,
  2022: 115.6,
  2023: 122.5,
  2024: 126.5,
  2025: 130.5,
  2026: 134.5,
};

export const BASE_YEAR = 2026;
export const BASE_CPI = PSA_CPI_SERIES[BASE_YEAR];

/**
 * Returns inflation multiplier to scale nominal PHP from year `year` to 2026 purchasing power.
 * Prior to 2005 clamps to 2005. Years beyond 2026 clamp to 2026.
 */
export function getCpiMultiplier(year: number): number {
  const clampedYear = Math.max(2005, Math.min(2026, Math.floor(year)));
  const cpi = PSA_CPI_SERIES[clampedYear] ?? BASE_CPI;
  return BASE_CPI / cpi;
}
