import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const glucoseReadings = sqliteTable("glucose_readings", {
  id: text("id").primaryKey(),
  glucoseLevel: real("glucose_lvl").notNull(),
  timestamp: text("timestamp")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  sensorId: text("sensor_id"),
});

export type GlucoseReading = typeof glucoseReadings.$inferSelect;
