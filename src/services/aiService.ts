import {
  BloodSugarReading,
  FoodEntry,
  InsulinDose,
  UserSettings,
} from "../types";
import {
  OPENAI_API_KEY,
  NORMAL_SUGAR_MIN,
  NORMAL_SUGAR_MAX,
} from "../constants";

// Rule-based analysis for initial MVP
export const analyzeGlucoseReadings = (
  readings: BloodSugarReading[],
  foodEntries: FoodEntry[] = [],
  insulinDoses: InsulinDose[] = [],
  userSettings?: UserSettings,
): string[] => {
  // Sort by timestamp
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (sortedReadings.length === 0) {
    return [
      "Start logging your blood sugar readings to get personalized insights.",
    ];
  }

  const insights: string[] = [];
  const recentReadings = sortedReadings.slice(0, 20); // Consider last 20 readings

  // Calculate statistics
  const values = recentReadings.map((r) => r.value);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const inRangeCount = values.filter(
    (v) => v >= NORMAL_SUGAR_MIN && v <= NORMAL_SUGAR_MAX,
  ).length;
  const inRangePercentage = (inRangeCount / values.length) * 100;

  // Latest reading analysis
  const latestReading = sortedReadings[0];
  if (latestReading.value < NORMAL_SUGAR_MIN) {
    insights.push(
      `Your latest reading of ${latestReading.value} mg/dL is below the target range. Consider having a small snack with fast-acting carbs.`,
    );
  } else if (latestReading.value > NORMAL_SUGAR_MAX) {
    insights.push(
      `Your latest reading of ${latestReading.value} mg/dL is above the target range. Stay hydrated and monitor closely over the next few hours.`,
    );
  } else {
    insights.push(
      `Your latest reading of ${latestReading.value} mg/dL is within the target range. Great job!`,
    );
  }

  // Time in range analysis
  if (recentReadings.length >= 5) {
    if (inRangePercentage >= 80) {
      insights.push(
        `${Math.round(inRangePercentage)}% of your recent readings are in range. Excellent blood sugar management!`,
      );
    } else if (inRangePercentage >= 60) {
      insights.push(
        `${Math.round(inRangePercentage)}% of your recent readings are in range. You're on the right track!`,
      );
    } else {
      insights.push(
        `${Math.round(inRangePercentage)}% of your recent readings are in range. Let's work on improving this with consistent monitoring and management.`,
      );
    }
  }

  // Trend analysis
  if (recentReadings.length >= 3) {
    const isIncreasing = values[0] > values[1] && values[1] > values[2];
    const isDecreasing = values[0] < values[1] && values[1] < values[2];

    if (isIncreasing && values[0] > NORMAL_SUGAR_MAX) {
      insights.push(
        "Your blood sugar levels show an upward trend. Consider checking for factors that might be causing this rise.",
      );
    } else if (isDecreasing && values[0] < NORMAL_SUGAR_MIN) {
      insights.push(
        "Your blood sugar levels show a downward trend. Be cautious about potential low blood sugar.",
      );
    }
  }

  // Variability analysis
  if (recentReadings.length >= 5) {
    const range = max - min;
    if (range > 100) {
      insights.push(
        `Your blood sugar has varied by ${range} mg/dL recently. High variability can be reduced with consistent meal timing and medication.`,
      );
    }
  }

  // Food correlation (simple rule-based for MVP)
  if (foodEntries.length > 0 && recentReadings.length > 1) {
    const recentFoods = foodEntries
      .filter(
        (f) =>
          new Date(f.timestamp).getTime() >
          new Date(recentReadings[1].timestamp).getTime(),
      )
      .map((f) => f.name)
      .join(", ");

    if (recentFoods && latestReading.value > NORMAL_SUGAR_MAX) {
      insights.push(
        `You recently consumed ${recentFoods}, which might be contributing to your elevated sugar level.`,
      );
    }
  }

  // Pattern identification (basic)
  const morningReadings = recentReadings.filter((r) => {
    const hour = new Date(r.timestamp).getHours();
    return hour >= 6 && hour <= 9;
  });

  const eveningReadings = recentReadings.filter((r) => {
    const hour = new Date(r.timestamp).getHours();
    return hour >= 18 && hour <= 22;
  });

  if (morningReadings.length >= 3) {
    const morningAvg =
      morningReadings.reduce((sum, r) => sum + r.value, 0) /
      morningReadings.length;
    if (morningAvg > NORMAL_SUGAR_MAX) {
      insights.push(
        "Your morning sugar readings tend to be higher. This could be due to the dawn phenomenon, where hormones released in the early morning increase blood sugar.",
      );
    }
  }

  if (eveningReadings.length >= 3) {
    const eveningAvg =
      eveningReadings.reduce((sum, r) => sum + r.value, 0) /
      eveningReadings.length;
    if (eveningAvg > NORMAL_SUGAR_MAX) {
      insights.push(
        "Your evening sugar readings tend to be higher. Consider reviewing your dinner choices or the timing of your evening medication.",
      );
    }
  }

  return insights;
};

// Advanced AI-powered analysis (for future implementation)
export const getAIPoweredInsights = async (
  glucoseReadings: BloodSugarReading[] = [],
  sugarReadings: BloodSugarReading[] = [],
  foodEntries: FoodEntry[] = [],
  insulinDoses: InsulinDose[] = [],
  userSettings?: UserSettings,
): Promise<string[]> => {
  try {
    // Combine readings (for simplicity in the MVP, we'll treat glucose and sugar readings the same)
    const combinedReadings = [...glucoseReadings, ...sugarReadings].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // NOTE: This is a placeholder for a real AI API integration
    // In production, this would call an external API that would analyze each user's unique data
    // The rule-based analysis below is just a temporary solution until the AI API is integrated
    return analyzeGlucoseReadings(
      combinedReadings,
      foodEntries,
      insulinDoses,
      userSettings,
    );

    /* 
    // Example of how the OpenAI API integration would work
    // This would be personalized for each user based on their actual data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a diabetes management assistant providing personalized insights and recommendations based on blood sugar data. Provide concise, actionable insights.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              readings: combinedReadings.slice(0, 30), // Send most recent 30 readings
              foodEntries: foodEntries.slice(0, 10), // Send most recent 10 food entries
              insulinDoses: insulinDoses.slice(0, 10), // Send most recent 10 insulin doses
              userSettings
            })
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    const aiInsights = data.choices[0].message.content;
    
    // Parse and format AI insights (assuming AI returns a JSON array of strings)
    return JSON.parse(aiInsights);
    */
  } catch (error) {
    console.error("Error getting AI insights:", error);
    // Fallback to rule-based analysis
    return analyzeGlucoseReadings(
      sugarReadings.length > 0 ? sugarReadings : glucoseReadings,
      foodEntries,
      insulinDoses,
      userSettings,
    );
  }
};
