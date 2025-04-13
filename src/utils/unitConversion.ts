// Conversion rates
const MG_DL_TO_MMOL_L = 0.0555;
const MMOL_L_TO_MG_DL = 18.0182;

/**
 * Convert a blood glucose value from mg/dL to mmol/L
 * @param mgdl Value in mg/dL
 * @returns Value in mmol/L
 */
export const mgdlToMmoll = (mgdl: number): number => {
  return parseFloat((mgdl * MG_DL_TO_MMOL_L).toFixed(1));
};

/**
 * Convert a blood glucose value from mmol/L to mg/dL
 * @param mmoll Value in mmol/L
 * @returns Value in mg/dL
 */
export const mmollToMgdl = (mmoll: number): number => {
  return Math.round(mmoll * MMOL_L_TO_MG_DL);
};

/**
 * Format blood glucose value according to the specified units
 * @param value The blood glucose value (always stored in mg/dL)
 * @param units The desired display units ('mg/dL' or 'mmol/L')
 * @returns Formatted string with appropriate units
 */
export const formatGlucoseValue = (value: number, units: 'mg/dL' | 'mmol/L'): string => {
  if (units === 'mmol/L') {
    return `${mgdlToMmoll(value)} ${units}`;
  }
  return `${value} ${units}`;
};

/**
 * Get just the numeric value in the specified units (without the unit label)
 * @param value The blood glucose value (always stored in mg/dL)
 * @param units The desired display units ('mg/dL' or 'mmol/L')
 * @returns Number in the specified units
 */
export const getGlucoseValue = (value: number, units: 'mg/dL' | 'mmol/L'): number => {
  if (units === 'mmol/L') {
    return mgdlToMmoll(value);
  }
  return value;
};

/**
 * Convert the threshold values based on the units
 * @param threshold The threshold value in mg/dL
 * @param units The desired units ('mg/dL' or 'mmol/L')
 * @returns The threshold value in the specified units
 */
export const convertThreshold = (threshold: number, units: 'mg/dL' | 'mmol/L'): number => {
  if (units === 'mmol/L') {
    return mgdlToMmoll(threshold);
  }
  return threshold;
}; 