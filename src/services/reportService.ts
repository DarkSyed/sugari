import {
  getBloodSugarReadings,
  getBloodSugarReadingsForTimeRange,
  getInsulinDoses,
  getFoodEntries,
  getA1CReadings,
  getWeightMeasurements,
  getBloodPressureReadings,
  getUserSettings,
} from "./database";
import {
  BloodSugarReading,
  InsulinDose,
  FoodEntry,
  A1CReading,
  WeightMeasurement,
  BloodPressureReading,
  UserSettings,
} from "../types";

// Function to get all health data for a specific date range
export const getHealthDataForDateRange = async (
  startDate: Date,
  endDate: Date,
) => {
  try {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    // Get all data types for the specified date range
    const bloodSugarReadings = await getBloodSugarReadingsForTimeRange(
      startTime,
      endTime,
    );

    // For other data types, we need to filter by date range manually
    const allInsulinDoses = await getInsulinDoses();
    const insulinDoses = allInsulinDoses.filter(
      (dose) => dose.timestamp >= startTime && dose.timestamp <= endTime,
    );

    const allFoodEntries = await getFoodEntries();
    const foodEntries = allFoodEntries.filter(
      (entry) => entry.timestamp >= startTime && entry.timestamp <= endTime,
    );

    const allA1CReadings = await getA1CReadings();
    const a1cReadings = allA1CReadings.filter(
      (reading) =>
        reading.timestamp >= startTime && reading.timestamp <= endTime,
    );

    const allWeightMeasurements = await getWeightMeasurements();
    const weightMeasurements = allWeightMeasurements.filter(
      (measurement) =>
        measurement.timestamp >= startTime && measurement.timestamp <= endTime,
    );

    const allBloodPressureReadings = await getBloodPressureReadings();
    const bloodPressureReadings = allBloodPressureReadings.filter(
      (reading) =>
        reading.timestamp >= startTime && reading.timestamp <= endTime,
    );

    // Get user settings for the report
    const userSettings = await getUserSettings();

    return {
      bloodSugarReadings,
      insulinDoses,
      foodEntries,
      a1cReadings,
      weightMeasurements,
      bloodPressureReadings,
      userSettings,
    };
  } catch (error) {
    console.error("Error getting health data for date range:", error);
    throw error;
  }
};

// Calculate statistics for blood sugar readings
export const calculateBloodSugarStats = (readings: BloodSugarReading[]) => {
  if (readings.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      inRangePercentage: 0,
      highPercentage: 0,
      lowPercentage: 0,
      readingsCount: 0,
    };
  }

  const values = readings.map((reading) => reading.value);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Count readings in different ranges (assuming standard ranges)
  const inRangeCount = readings.filter(
    (r) => r.value >= 70 && r.value <= 180,
  ).length;
  const highCount = readings.filter((r) => r.value > 180).length;
  const lowCount = readings.filter((r) => r.value < 70).length;

  const inRangePercentage = (inRangeCount / readings.length) * 100;
  const highPercentage = (highCount / readings.length) * 100;
  const lowPercentage = (lowCount / readings.length) * 100;

  return {
    average: parseFloat(average.toFixed(1)),
    min,
    max,
    inRangePercentage: parseFloat(inRangePercentage.toFixed(1)),
    highPercentage: parseFloat(highPercentage.toFixed(1)),
    lowPercentage: parseFloat(lowPercentage.toFixed(1)),
    readingsCount: readings.length,
  };
};

// Calculate statistics for insulin doses
export const calculateInsulinStats = (doses: InsulinDose[]) => {
  if (doses.length === 0) {
    return {
      totalInsulin: 0,
      averagePerDay: 0,
      dosesCount: 0,
    };
  }

  const totalInsulin = doses.reduce((acc, dose) => acc + dose.units, 0);

  // Calculate unique days in the dataset
  const uniqueDays = new Set(
    doses.map((dose) => new Date(dose.timestamp).toDateString()),
  );

  const averagePerDay = totalInsulin / uniqueDays.size;

  return {
    totalInsulin: parseFloat(totalInsulin.toFixed(1)),
    averagePerDay: parseFloat(averagePerDay.toFixed(1)),
    dosesCount: doses.length,
  };
};

// Calculate statistics for food entries
export const calculateFoodStats = (entries: FoodEntry[]) => {
  if (entries.length === 0) {
    return {
      totalCarbs: 0,
      averageCarbsPerDay: 0,
      entriesCount: 0,
    };
  }

  // Some entries might not have carbs data
  const entriesWithCarbs = entries.filter(
    (entry) => entry.carbs !== null && entry.carbs !== undefined,
  );

  if (entriesWithCarbs.length === 0) {
    return {
      totalCarbs: 0,
      averageCarbsPerDay: 0,
      entriesCount: entries.length,
    };
  }

  const totalCarbs = entriesWithCarbs.reduce(
    (acc, entry) => acc + (entry.carbs || 0),
    0,
  );

  // Calculate unique days in the dataset
  const uniqueDays = new Set(
    entries.map((entry) => new Date(entry.timestamp).toDateString()),
  );

  const averageCarbsPerDay = totalCarbs / uniqueDays.size;

  return {
    totalCarbs: parseFloat(totalCarbs.toFixed(1)),
    averageCarbsPerDay: parseFloat(averageCarbsPerDay.toFixed(1)),
    entriesCount: entries.length,
  };
};

// Format date for display
export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format time for display
export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format date and time for display
export const formatDateTime = (timestamp: number) => {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

// Group readings by day for the report
export const groupReadingsByDay = (readings: BloodSugarReading[]) => {
  const grouped: { [key: string]: BloodSugarReading[] } = {};

  readings.forEach((reading) => {
    const dateStr = new Date(reading.timestamp).toDateString();
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(reading);
  });

  // Convert to array of day objects
  return Object.keys(grouped).map((dateStr) => ({
    date: dateStr,
    readings: grouped[dateStr].sort((a, b) => a.timestamp - b.timestamp),
  }));
};

// Calculate BMI if weight and height are available
export const calculateBMI = (weightKg: number, heightCm: number) => {
  if (!weightKg || !heightCm) return null;

  // BMI formula: weight (kg) / (height (m))^2
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  return parseFloat(bmi.toFixed(1));
};

// Get BMI category
export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};
