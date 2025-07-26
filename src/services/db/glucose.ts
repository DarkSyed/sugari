import { useSQLiteContext } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { type GlucoseReading, glucoseReadings } from "@/db/schema";
import { v7 as uuidv7 } from "uuid";

export const useGlucoseService = () => {
  const dbInstance = useSQLiteContext();
  const db = drizzle(dbInstance);

  const createReading = async (
    reading: Omit<GlucoseReading, "id" | "timestamp">,
  ): Promise<GlucoseReading> => {
    try {
      const [newReading] = await db
        .insert(glucoseReadings)
        .values({
          id: uuidv7(),
          glucoseLevel: reading.glucoseLevel,
          sensorId: reading.sensorId,
          timestamp: new Date().toISOString(),
        })
        .returning();
      return newReading;
    } catch (error) {
      throw new Error(`Failed to create reading: ${error}`);
    }
  };

  return { createReading };
};
