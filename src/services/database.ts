import * as SQLite from 'expo-sqlite';
import { BloodSugarReading, FoodEntry, InsulinDose, UserSettings, A1CReading, WeightMeasurement, BloodPressureReading } from '../types';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

// Open database
const dbName = 'sugari.db';
let db: SQLite.SQLiteDatabase;

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Open the database
      db = SQLite.openDatabaseSync(dbName);
      console.log('Database opened:', dbName);
      
      // Create all necessary tables
      await createUserSettingsTable();
      await createBloodSugarReadingsTable();
      await createFoodEntriesTable();
      await createInsulinDosesTable();
      await createA1CReadingsTable();
      await createWeightMeasurementsTable();
      await createBloodPressureReadingsTable();
      
      // Create default user settings if none exist
      await initDefaultUserSettings();
      
      console.log('Database initialized successfully');
      resolve();
    } catch (error) {
      console.error('Error in database initialization:', error);
      reject(error);
    }
  });
};

// Create user_settings table
const createUserSettingsTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
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
      resolve();
    } catch (error) {
      console.error('Error creating user_settings table:', error);
      reject(error);
    }
  });
};

// Create blood_sugar_readings table
const createBloodSugarReadingsTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS blood_sugar_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          context TEXT,
          notes TEXT
        )
      `);
      resolve();
    } catch (error) {
      console.error('Error creating blood_sugar_readings table:', error);
      reject(error);
    }
  });
};

// Create food_entries table
const createFoodEntriesTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS food_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          carbs REAL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      resolve();
    } catch (error) {
      console.error('Error creating food_entries table:', error);
      reject(error);
    }
  });
};

// Create insulin_doses table
const createInsulinDosesTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS insulin_doses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          units REAL NOT NULL,
          type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      resolve();
    } catch (error) {
      console.error('Error creating insulin_doses table:', error);
      reject(error);
    }
  });
};

// Create a1c_readings table
const createA1CReadingsTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS a1c_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      resolve();
    } catch (error) {
      console.error('Error creating a1c_readings table:', error);
      reject(error);
    }
  });
};

// Create weight_measurements table
const createWeightMeasurementsTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS weight_measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      resolve();
    } catch (error) {
      console.error('Error creating weight_measurements table:', error);
      reject(error);
    }
  });
};

// Create blood_pressure_readings table
const createBloodPressureReadingsTable = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.execAsync(`
        CREATE TABLE IF NOT EXISTS blood_pressure_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          systolic INTEGER NOT NULL,
          diastolic INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      resolve();
    } catch (error) {
      console.error('Error creating blood_pressure_readings table:', error);
      reject(error);
    }
  });
};

// Initialize default user settings if none exist
const initDefaultUserSettings = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_settings');
      const count = result[0]?.count || 0;
      
      if (count === 0) {
        await db.runAsync(
          'INSERT INTO user_settings (email, notifications, dark_mode, units) VALUES (NULL, 1, 0, ?)',
          ['mg/dL']
        );
      }
      resolve();
    } catch (error) {
      console.error('Error initializing default user settings:', error);
      reject(error);
    }
  });
};

// User Settings functions
export const getUserSettings = async (): Promise<UserSettings> => {
  return new Promise(async (resolve, reject) => {
    try {
      let settings = await db.getAllAsync<any>('SELECT * FROM user_settings LIMIT 1');
      
      if (settings.length === 0) {
        // Create default settings if none exist
        await db.runAsync(
          'INSERT INTO user_settings (email, notifications, dark_mode, units) VALUES (NULL, 1, 0, ?)',
          ['mg/dL']
        );
        settings = await db.getAllAsync<any>('SELECT * FROM user_settings LIMIT 1');
      }
      
      const row = settings[0];
      resolve({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        diabetesType: row.diabetes_type,
        notifications: Boolean(row.notifications),
        darkMode: Boolean(row.dark_mode),
        units: row.units,
      });
    } catch (error) {
      console.error('Error getting user settings:', error);
      reject(error);
    }
  });
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const updates: string[] = [];
      const args: any[] = [];
      
      if (settings.email !== undefined) {
        updates.push('email = ?');
        args.push(settings.email);
      }
      if (settings.firstName !== undefined) {
        updates.push('first_name = ?');
        args.push(settings.firstName);
      }
      if (settings.lastName !== undefined) {
        updates.push('last_name = ?');
        args.push(settings.lastName);
      }
      if (settings.diabetesType !== undefined) {
        updates.push('diabetes_type = ?');
        args.push(settings.diabetesType);
      }
      if (settings.notifications !== undefined) {
        updates.push('notifications = ?');
        args.push(settings.notifications ? 1 : 0);
      }
      if (settings.darkMode !== undefined) {
        updates.push('dark_mode = ?');
        args.push(settings.darkMode ? 1 : 0);
      }
      if (settings.units !== undefined) {
        updates.push('units = ?');
        args.push(settings.units);
      }
      
      if (updates.length === 0) {
        resolve();
        return;
      }
      
      await db.runAsync(
        `UPDATE user_settings SET ${updates.join(', ')} WHERE id = (SELECT id FROM user_settings LIMIT 1)`,
        args
      );
      resolve();
    } catch (error) {
      console.error('Error updating user settings:', error);
      reject(error);
    }
  });
};

// Blood Sugar Reading functions
export const addBloodSugarReading = async (reading: Omit<BloodSugarReading, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO blood_sugar_readings (value, timestamp, context, notes) VALUES (?, ?, ?, ?)',
        [reading.value, reading.timestamp, reading.context || null, reading.notes || null]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      console.error('Error adding blood sugar reading:', error);
      reject(error);
    }
  });
};

export const updateBloodSugarReading = async (id: number, reading: Partial<BloodSugarReading>): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const updates: string[] = [];
      const args: any[] = [];
      
      if (reading.value !== undefined) {
        updates.push('value = ?');
        args.push(reading.value);
      }
      if (reading.timestamp !== undefined) {
        updates.push('timestamp = ?');
        args.push(reading.timestamp);
      }
      if (reading.context !== undefined) {
        updates.push('context = ?');
        args.push(reading.context);
      }
      if (reading.notes !== undefined) {
        updates.push('notes = ?');
        args.push(reading.notes);
      }
      
      if (updates.length === 0) {
        resolve();
        return;
      }
      
      args.push(id);
      
      await db.runAsync(
        `UPDATE blood_sugar_readings SET ${updates.join(', ')} WHERE id = ?`,
        args
      );
      resolve();
    } catch (error) {
      console.error('Error updating blood sugar reading:', error);
      reject(error);
    }
  });
};

export const deleteBloodSugarReading = async (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.runAsync('DELETE FROM blood_sugar_readings WHERE id = ?', [id]);
      resolve();
    } catch (error) {
      console.error('Error deleting blood sugar reading:', error);
      reject(error);
    }
  });
};

export const getBloodSugarReadings = async (limit?: number): Promise<BloodSugarReading[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = 'SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC';
      const params: any[] = [];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      
      const rows = await db.getAllAsync<any>(sql, params);
      
      const readings: BloodSugarReading[] = rows.map(row => ({
        id: row.id,
        value: row.value,
        timestamp: row.timestamp,
        context: row.context,
        notes: row.notes
      }));
      
      resolve(readings);
    } catch (error) {
      console.error('Error getting blood sugar readings:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
};

export const getBloodSugarReadingsForTimeRange = async (startTime: number, endTime: number): Promise<BloodSugarReading[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM blood_sugar_readings WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [startTime, endTime]
      );
      
      const readings: BloodSugarReading[] = rows.map(row => ({
        id: row.id,
        value: row.value,
        timestamp: row.timestamp,
        context: row.context,
        notes: row.notes
      }));
      
      resolve(readings);
    } catch (error) {
      console.error('Error getting blood sugar readings for time range:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
};

export const getBloodSugarReadingsForCurrentWeek = async (): Promise<BloodSugarReading[]> => {
  const start = getStartOfWeek(new Date()).getTime();
  const end = getEndOfWeek(new Date()).getTime();
  return await getBloodSugarReadingsForTimeRange(start, end);
};

// Food Entry functions
export const addFoodEntry = async (entry: Omit<FoodEntry, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO food_entries (name, carbs, timestamp, notes) VALUES (?, ?, ?, ?)',
        [entry.name, entry.carbs || null, entry.timestamp, entry.notes || null]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      console.error('Error adding food entry:', error);
      reject(error);
    }
  });
};

export const getFoodEntries = async (limit?: number): Promise<FoodEntry[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = 'SELECT * FROM food_entries ORDER BY timestamp DESC';
      const params: any[] = [];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      
      const rows = await db.getAllAsync<any>(sql, params);
      
      const entries: FoodEntry[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        carbs: row.carbs,
        timestamp: row.timestamp,
        notes: row.notes
      }));
      
      resolve(entries);
    } catch (error) {
      console.error('Error getting food entries:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
};

// Insulin Dose functions
export const addInsulinDose = async (dose: Omit<InsulinDose, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO insulin_doses (units, type, timestamp, notes) VALUES (?, ?, ?, ?)',
        [dose.units, dose.type, dose.timestamp, dose.notes || null]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      console.error('Error adding insulin dose:', error);
      reject(error);
    }
  });
};

export const getInsulinDoses = async (limit?: number): Promise<InsulinDose[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = 'SELECT * FROM insulin_doses ORDER BY timestamp DESC';
      const params: any[] = [];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      
      const rows = await db.getAllAsync<any>(sql, params);
      
      const doses: InsulinDose[] = rows.map(row => ({
        id: row.id,
        units: row.units,
        type: row.type,
        timestamp: row.timestamp,
        notes: row.notes
      }));
      
      resolve(doses);
    } catch (error) {
      console.error('Error getting insulin doses:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
};

// A1C Reading functions
export const addA1CReading = async (reading: Omit<A1CReading, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO a1c_readings (value, timestamp, notes) VALUES (?, ?, ?)',
        [reading.value, reading.timestamp, reading.notes || null]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      console.error('Error adding A1C reading:', error);
      reject(error);
    }
  });
};

export const getA1CReadings = async (limit?: number): Promise<A1CReading[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = 'SELECT * FROM a1c_readings ORDER BY timestamp DESC';
      const params: any[] = [];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      
      const rows = await db.getAllAsync<any>(sql, params);
      
      const readings: A1CReading[] = rows.map(row => ({
        id: row.id,
        value: row.value,
        timestamp: row.timestamp,
        notes: row.notes
      }));
      
      resolve(readings);
    } catch (error) {
      console.error('Error getting A1C readings:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
};

// Weight Measurement functions
export const addWeightMeasurement = async (measurement: Omit<WeightMeasurement, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO weight_measurements (value, timestamp, notes) VALUES (?, ?, ?)',
        [measurement.value, measurement.timestamp, measurement.notes || null]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      console.error('Error adding weight measurement:', error);
      reject(error);
    }
  });
};

export const getWeightMeasurements = async (limit?: number): Promise<WeightMeasurement[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = 'SELECT * FROM weight_measurements ORDER BY timestamp DESC';
      const params: any[] = [];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      
      const rows = await db.getAllAsync<any>(sql, params);
      
      const measurements: WeightMeasurement[] = rows.map(row => ({
        id: row.id,
        value: row.value,
        timestamp: row.timestamp,
        notes: row.notes
      }));
      
      resolve(measurements);
    } catch (error) {
      console.error('Error getting weight measurements:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
};

// Blood Pressure Reading functions
export const addBloodPressureReading = async (reading: Omit<BloodPressureReading, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await db.runAsync(
        'INSERT INTO blood_pressure_readings (systolic, diastolic, timestamp, notes) VALUES (?, ?, ?, ?)',
        [reading.systolic, reading.diastolic, reading.timestamp, reading.notes || null]
      );
      resolve(result.lastInsertRowId);
    } catch (error) {
      console.error('Error adding blood pressure reading:', error);
      reject(error);
    }
  });
};

export const getBloodPressureReadings = async (limit?: number): Promise<BloodPressureReading[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let sql = 'SELECT * FROM blood_pressure_readings ORDER BY timestamp DESC';
      const params: any[] = [];
      
      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
      }
      
      const rows = await db.getAllAsync<any>(sql, params);
      
      const readings: BloodPressureReading[] = rows.map(row => ({
        id: row.id,
        systolic: row.systolic,
        diastolic: row.diastolic,
        timestamp: row.timestamp,
        notes: row.notes
      }));
      
      resolve(readings);
    } catch (error) {
      console.error('Error getting blood pressure readings:', error);
      resolve([]);  // Resolve with empty array instead of rejecting
    }
  });
}; 