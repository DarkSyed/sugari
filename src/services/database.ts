import * as SQLite from "expo-sqlite";
import {
  BloodSugarReading,
  FoodEntry,
  InsulinDose,
  UserSettings,
  A1CReading,
  WeightMeasurement,
  BloodPressureReading,
  Medication,
} from "../types";
import { getStartOfWeek, getEndOfWeek } from "../utils/dateUtils";
import * as FileSystem from "expo-file-system";
import { BottomTabBarHeightCallbackContext } from "@react-navigation/bottom-tabs";

type SQLTransaction = any;
type SQLResultSet = any;
type SQLError = any;

const getDatabase = () => {
  return SQLite.openDatabaseAsync("sugari.db", { useNewConnection: true });
};

export const initDatabase = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDatabase();

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          diabetes_type TEXT,
          notifications INTEGER DEFAULT 1,
          dark_mode INTEGER DEFAULT 0,
          units TEXT DEFAULT 'mg/dL'
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS blood_sugar_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          context TEXT,
          notes TEXT
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS food_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          carbs REAL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS insulin_doses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          units REAL NOT NULL,
          type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS a1c_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS weight_measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS blood_pressure_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          systolic INTEGER NOT NULL,
          diastolic INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS medications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          dosage TEXT NOT NULL,
          frequency TEXT NOT NULL,
          notes TEXT,
          imagePath TEXT,
          timestamp INTEGER NOT NULL
        )
      `);

      const result = await db.getAllAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM user_settings"
      );
      const count = result[0]?.count || 0;

      if (count === 0) {
        await db.runAsync(
          "INSERT INTO user_settings (email, notifications, dark_mode, units) VALUES (NULL, 1, 0, ?)",
          ["mg/dL"]
        );
      }

      console.log("Database initialized successfully");
      resolve();
    } catch (error) {
      console.error("Error in database initialization:", error);
      reject(error);
    }
  });
};

export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<any>(
      "SELECT * FROM user_settings LIMIT 1"
    );

    if (result.length === 0) {
      await db.runAsync(
        `INSERT INTO user_settings (email, notifications, dark_mode, units) 
        VALUES (NULL, 1, 0, 'mg/dL')`
      );

      const newResult = await db.getAllAsync<any>(
        "SELECT * FROM user_settings LIMIT 1"
      );
      const row = newResult[0];

      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        diabetesType: row.diabetes_type,
        notifications: Boolean(row.notifications),
        darkMode: Boolean(row.dark_mode),
        units: row.units,
      };
    } else {
      const row = result[0];
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        diabetesType: row.diabetes_type,
        notifications: Boolean(row.notifications),
        darkMode: Boolean(row.dark_mode),
        units: row.units,
      };
    }
  } catch (error) {
    console.error("Error getting user settings:", error);
    throw error;
  }
};

export const updateUserSettings = async (
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const db = await getDatabase();
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        let column = key;

        switch (key) {
          case "firstName":
            column = "first_name";
            break;
          case "lastName":
            column = "last_name";
            break;
          case "diabetesType":
            column = "diabetes_type";
            break;
          case "darkMode":
            column = "dark_mode";
            value = value ? 1 : 0;
            break;
          case "notications":
            column = "notifications";
            value = value ? 1 : 0;
            break;
        }

        updateFields.push(`${column} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    const sql = `UPDATE user_settings SET ${updateFields.join(
      ", "
    )} WHERE id = (SELECT id FROM user_settings LIMIT 1)`;

    console.log("Executing SQL:", sql, "with values:", values);
    await db.runAsync(sql, values);
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

export const addBloodSugarReading = async (
  reading: Omit<BloodSugarReading, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO blood_sugar_readings (value, timestamp, context, notes) VALUES (?, ?, ?, ?)",
      [
        reading.value,
        reading.timestamp,
        reading.context || null,
        reading.notes || null,
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding blood sugar reading:", error);
    throw error;
  }
};

export const updateBloodSugarReading = async (
  id: number,
  reading: Partial<BloodSugarReading>
): Promise<void> => {
  try {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(reading).forEach(([key, value]) => {
      if (key !== "id") {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);

    const sql = `UPDATE blood_sugar_readings SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing SQL:", sql, "with values:", values);

    await db.runAsync(sql, values);

    console.log("Successfully updated reading with ID:", id);
  } catch (error) {
    console.error("Error updating blood sugar reading:", error);
    throw error;
  }
};

export const deleteBloodSugarReading = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM blood_sugar_readings WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting blood sugar reading:", error);
    throw error;
  }
};

export const getBloodSugarReadings = async (
  limit?: number
): Promise<BloodSugarReading[]> => {
  try {
    const db = await getDatabase();
    let sql = "SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const result = await db.getAllAsync<any>(sql, params);

    const readings: BloodSugarReading[] = result.map((row) => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      context: row.context,
      notes: row.notes,
    }));

    return readings;
  } catch (error) {
    console.error("Error getting blood sugar readings:", error);
    return [];
  }
};

export const getBloodSugarReadingsForTimeRange = async (
  startTime: number,
  endTime: number
): Promise<BloodSugarReading[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<any>(
      "SELECT * FROM blood_sugar_readings WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC",
      [startTime, endTime]
    );

    const readings: BloodSugarReading[] = result.map((row) => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      context: row.context,
      notes: row.notes,
    }));

    return readings;
  } catch (error) {
    console.error("Error getting blood sugar readings for time range:", error);
    return [];
  }
};

export const getBloodSugarReadingsForCurrentWeek = async (): Promise<
  BloodSugarReading[]
> => {
  const startTime = getStartOfWeek(new Date()).getTime();
  const endTime = getEndOfWeek(new Date()).getTime();
  return getBloodSugarReadingsForTimeRange(startTime, endTime);
};

export const addFoodEntry = async (
  entry: Omit<FoodEntry, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO food_entries (name, carbs, timestamp, notes) VALUES (?, ?, ?, ?)",
      [entry.name, entry.carbs || null, entry.timestamp, entry.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding food entry:", error);
    throw error;
  }
};

export const updateFoodEntry = async (
  id: number,
  entry: Partial<FoodEntry>
): Promise<void> => {
  try {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(entry).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);
    const sql = `UPDATE food_entries SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing SQL:", sql, "with values:", values);
    await db.runAsync(sql, values);

    console.log("Successfully updated food entry with ID:", id);
  } catch (error) {
    console.error("Error updating food entry:", error);
    throw error;
  }
};

export const getFoodEntries = async (limit?: number): Promise<FoodEntry[]> => {
  try {
    const db = await getDatabase();
    let sql = "SELECT * FROM food_entries ORDER BY timestamp DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const result = await db.getAllAsync<any>(sql, params);

    const entries: FoodEntry[] = result.map((row) => ({
      id: row.id,
      name: row.name,
      carbs: row.carbs,
      timestamp: row.timestamp,
      notes: row.notes,
    }));

    return entries;
  } catch (error) {
    console.error("Error getting food entries:", error);
    throw error;
  }
};

export const deleteFoodEntry = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM food_entries WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting food entry:", error);
    throw error;
  }
};

export const addInsulinDose = async (
  dose: Omit<InsulinDose, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO insulin_doses (units, type, timestamp, notes) VALUES (?, ?, ?, ?)",
      [dose.units, dose.type, dose.timestamp, dose.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding insulin dose:", error);
    throw error;
  }
};

export const updateInsulinDose = async (
  id: number,
  dose: Partial<InsulinDose>
): Promise<void> => {
  try {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(dose).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);
    const sql = `UPDATE insulin_doses SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing SQL:", sql, "with values:", values);

    await db.runAsync(sql, values);
    console.log("Successfully insulin entry with ID:", id);
  } catch (error) {
    console.error("Error updating insulin entry:", error);
    throw error;
  }
};

export const getInsulinDoses = async (
  limit?: number
): Promise<InsulinDose[]> => {
  try {
    const db = await getDatabase();
    let sql = "SELECT * FROM insulin_doses ORDER BY timestamp DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const result = await db.getAllAsync<any>(sql, params);

    const doses: InsulinDose[] = result.map((row) => ({
      id: row.id,
      units: row.units,
      type: row.type,
      timestamp: row.timestamp,
      notes: row.notes,
    }));

    return doses;
  } catch (error) {
    console.error("Error getting insulin doses:", error);
    throw error;
  }
};

export const deleteInsulinDose = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM insulin_doses WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting insulin dose:", error);
    throw error;
  }
};

export const addA1CReading = async (
  reading: Omit<A1CReading, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO a1c_readings (value, timestamp, notes) VALUES (?, ?, ?)",
      [reading.value, reading.timestamp, reading.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding A1C reading:", error);
    throw error;
  }
};

export const updateA1CReading = async (
  id: number,
  reading: Partial<A1CReading>
): Promise<void> => {
  try {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(reading).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);
    const sql = `UPDATE a1c_readings SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing SQL:", sql, "with values:", values);
    await db.runAsync(sql, values);
    console.log("Successfully updated A1C entry with ID:", id);
  } catch (error) {
    console.error("Error updating A1C entry:", error);
    throw error;
  }
};

export const getA1CReadings = async (limit?: number): Promise<A1CReading[]> => {
  try {
    const db = await getDatabase();
    let sql = "SELECT * FROM a1c_readings ORDER BY timestamp DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const result = await db.getAllAsync<any>(sql, params);

    const readings: A1CReading[] = result.map((row) => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      notes: row.notes,
    }));

    return readings;
  } catch (error) {
    console.error("Error getting A1C readings:", error);
    throw error;
  }
};

export const deleteA1CReading = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM a1c_readings WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting A1C reading:", error);
    throw error;
  }
};

export const addWeightMeasurement = async (
  measurement: Omit<WeightMeasurement, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO weight_measurements (value, timestamp, notes) VALUES (?, ?, ?)",
      [measurement.value, measurement.timestamp, measurement.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding weight measurement:", error);
    throw error;
  }
};

export const updateWeightMeasurement = async (
  id: number,
  measurement: Partial<WeightMeasurement>
): Promise<void> => {
  try {
    const db = await getDatabase();
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(measurement).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);
    const sql = `UPDATE weight_measurements SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing SQL:", sql, "with values:", values);

    await db.runAsync(sql, values);

    console.log("Successfully updated weight measurement with ID:", id);
  } catch (error) {
    console.error("Error updating weight measurement:", error);
    throw error;
  }
};

export const getWeightMeasurements = async (
  limit?: number
): Promise<WeightMeasurement[]> => {
  try {
    const db = await getDatabase();
    let sql = "SELECT * FROM weight_measurements ORDER BY timestamp DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const result = await db.getAllAsync<any>(sql, params);

    const measurements: WeightMeasurement[] = result.map((row) => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      notes: row.notes,
    }));

    return measurements;
  } catch (error) {
    console.error("Error getting weight measurements:", error);
    throw error;
  }
};

export const deleteWeightMeasurement = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM weight_measurements WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting weight measurement:", error);
    throw error;
  }
};

export const addBloodPressureReading = async (
  reading: Omit<BloodPressureReading, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO blood_pressure_readings (systolic, diastolic, timestamp, notes) VALUES (?, ?, ?, ?)",
      [
        reading.systolic,
        reading.diastolic,
        reading.timestamp,
        reading.notes || null,
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding blood pressure reading:", error);
    throw error;
  }
};

export const updateBloodPressureReading = async (
  id: number,
  reading: Partial<BloodPressureReading>
): Promise<void> => {
  try {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(reading).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);

    const sql = `UPDATE blood_pressure_readings SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing BP update SQL:", sql, values);
    await db.runAsync(sql, values);
    console.log("Successfully updated blood pressure reading with ID:", id);
  } catch (error) {
    console.error("Error updating blood pressure reading:", error);
    throw error;
  }
};

export const getBloodPressureReadings = async (
  limit?: number
): Promise<BloodPressureReading[]> => {
  try {
    const db = await getDatabase();
    let sql = "SELECT * FROM blood_pressure_readings ORDER BY timestamp DESC";
    const params: any[] = [];

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    const result = await db.getAllAsync<any>(sql, params);

    const readings: BloodPressureReading[] = result.map((row) => ({
      id: row.id,
      systolic: row.systolic,
      diastolic: row.diastolic,
      timestamp: row.timestamp,
      notes: row.notes,
    }));

    return readings;
  } catch (error) {
    console.error("Error getting blood pressure readings:", error);
    throw error;
  }
};

export const deleteBloodPressureReading = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM blood_pressure_readings WHERE id = ?", [id]);
  } catch (error) {
    console.error("Error deleting blood pressure reading:", error);
    throw error;
  }
};

export const getBloodPressureReadingsForTimeRange = async (
  startTime: number,
  endTime: number
): Promise<BloodPressureReading[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<any>(
      "SELECT * FROM blood_pressure_readings WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC",
      [startTime, endTime]
    );

    const readings: BloodPressureReading[] = result.map((row) => ({
      id: row.id,
      systolic: row.systolic,
      diastolic: row.diastolic,
      timestamp: row.timestamp,
      notes: row.notes,
    }));

    return readings;
  } catch (error) {
    console.error(
      "Error getting blood pressure readings for time range:",
      error
    );
    throw error;
  }
};

export const addMedication = async (
  medication: Omit<Medication, "id">
): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO medications (name, type, dosage, frequency, notes, imagePath, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        medication.name,
        medication.type,
        medication.dosage,
        medication.frequency,
        medication.notes || null,
        medication.imagePath || null,
        medication.timestamp,
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error adding medication:", error);
    throw error;
  }
};

export const getMedications = async (): Promise<Medication[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<any>(
      "SELECT * FROM medications ORDER BY timestamp DESC"
    );

    const medications: Medication[] = result.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as "pill" | "injection",
      dosage: row.dosage,
      frequency: row.frequency,
      notes: row.notes,
      imagePath: row.imagePath,
      timestamp: row.timestamp,
    }));

    return medications;
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
};

export const updateMedication = async (
  id: number,
  medication: Partial<Medication>
): Promise<void> => {
  try {
    const db = await getDatabase();

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(medication).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (!updateFields.length) {
      return;
    }

    values.push(id);

    const sql = `UPDATE medications SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    console.log("Executing medication update SQL:", sql, values);
    await db.runAsync(sql, values);
    console.log("Successfully updated medication with ID:", id);
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
};

export const deleteMedication = async (id: number): Promise<void> => {
  try {
    const db = await getDatabase();

    const result = await db.getAllAsync<any>(
      "SELECT imagePath FROM medications WHERE id = ?",
      [id]
    );

    await db.runAsync("DELETE FROM medications WHERE id = ?", [id]);

    const imagePath = result[0]?.imagePath;
    if (imagePath) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(imagePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(imagePath);
        }
      } catch (fileError) {
        console.warn("Error deleting medication image file:", fileError);
      }
    }
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
};

export const resetDatabase = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log("Resetting database...");
    const db = await getDatabase();

    await db.runAsync("DROP TABLE IF EXISTS user_settings");
    await db.runAsync("DROP TABLE IF EXISTS blood_sugar_readings");
    await db.runAsync("DROP TABLE IF EXISTS food_entries");
    await db.runAsync("DROP TABLE IF EXISTS insulin_doses");
    await db.runAsync("DROP TABLE IF EXISTS a1c_readings");
    await db.runAsync("DROP TABLE IF EXISTS weight_measurements");
    await db.runAsync("DROP TABLE IF EXISTS blood_pressure_readings");
    await db.runAsync("DROP TABLE IF EXISTS medications");

    await initDatabase();

    console.log("Database reset successfully");
    return {
      success: true,
      message:
        "Database has been reset successfully. All data has been cleared.",
    };
  } catch (error) {
    console.error("Error resetting database:", error);
    return {
      success: false,
      message: `Failed to reset database: ${error}`,
    };
  }
};
