import * as SQLite from 'expo-sqlite';
import { BloodSugarReading, FoodEntry, InsulinDose, UserSettings, A1CReading, WeightMeasurement, BloodPressureReading } from '../types';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

// Define types for SQLite operations
type SQLTransaction = any;
type SQLResultSet = any;
type SQLError = any;

// Open database using the correct method for Expo SQLite v15+
// Moving this inside each function to ensure it's initialized properly
// const db = SQLite.openDatabaseSync('sugari.db');

// Initialize the database by creating all necessary tables
export const initDatabase = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = getDatabase();
      
      // Create user_settings table
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

      // Create blood_sugar_readings table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS blood_sugar_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          context TEXT,
          notes TEXT
        )
      `);

      // Create food_entries table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS food_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          carbs REAL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);

      // Create insulin_doses table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS insulin_doses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          units REAL NOT NULL,
          type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      
      // Create a1c_readings table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS a1c_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      
      // Create weight_measurements table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS weight_measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      
      // Create blood_pressure_readings table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS blood_pressure_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          systolic INTEGER NOT NULL,
          diastolic INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          notes TEXT
        )
      `);
      
      // Create default user settings if none exist
      const result = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_settings');
      const count = result[0]?.count || 0;
      
      if (count === 0) {
        await db.runAsync(
          'INSERT INTO user_settings (email, notifications, dark_mode, units) VALUES (NULL, 1, 0, ?)',
          ['mg/dL']
        );
      }
      
      console.log('Database initialized successfully');
      resolve();
    } catch (error) {
      console.error('Error in database initialization:', error);
      reject(error);
    }
  });
};

// Helper function to get database instance
const getDatabase = () => {
  return SQLite.openDatabaseSync('sugari.db');
};

// User Settings functions
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const db = getDatabase();
    // Try to get existing settings
    const result = await db.getAllAsync<any>('SELECT * FROM user_settings LIMIT 1');
    
    if (result.length === 0) {
      // Create default settings if none exist
      await db.runAsync(
        `INSERT INTO user_settings (email, notifications, dark_mode, units) 
        VALUES (NULL, 1, 0, 'mg/dL')`
      );
      
      // Fetch the newly created settings
      const newResult = await db.getAllAsync<any>('SELECT * FROM user_settings LIMIT 1');
      const row = newResult[0];
      
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        diabetesType: row.diabetes_type,
        notifications: Boolean(row.notifications),
        darkMode: Boolean(row.dark_mode),
        units: row.units
      };
    } else {
      // Return existing settings
      const row = result[0];
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        diabetesType: row.diabetes_type,
        notifications: Boolean(row.notifications),
        darkMode: Boolean(row.dark_mode),
        units: row.units
      };
    }
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  try {
    const db = getDatabase();
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
      return;
    }

    await db.runAsync(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE id = (SELECT id FROM user_settings LIMIT 1)`,
      args
    );
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Blood Sugar Reading functions
export const addBloodSugarReading = async (reading: Omit<BloodSugarReading, 'id'>): Promise<number> => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO blood_sugar_readings (value, timestamp, context, notes) VALUES (?, ?, ?, ?)',
      [reading.value, reading.timestamp, reading.context || null, reading.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding blood sugar reading:', error);
    throw error;
  }
};

export const updateBloodSugarReading = async (reading: BloodSugarReading): Promise<void> => {
  try {
    const db = getDatabase();
    
    // Use runAsync instead of transaction
    await db.runAsync(
      `UPDATE blood_sugar_readings 
       SET value = ?, timestamp = ?, context = ?, notes = ? 
       WHERE id = ?`,
      [
        reading.value,
        reading.timestamp,
        reading.context || null,
        reading.notes || null,
        reading.id
      ]
    );
  } catch (error) {
    console.error('Error updating blood sugar reading:', error);
    throw error;
  }
};

export const deleteBloodSugarReading = async (id: number): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM blood_sugar_readings WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting blood sugar reading:', error);
    throw error;
  }
};

export const getBloodSugarReadings = async (limit?: number): Promise<BloodSugarReading[]> => {
  try {
    const db = getDatabase();
    let sql = 'SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const result = await db.getAllAsync<any>(sql, params);
    
    const readings: BloodSugarReading[] = result.map(row => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      context: row.context,
      notes: row.notes
    }));
    
    return readings;
  } catch (error) {
    console.error('Error getting blood sugar readings:', error);
    return [];  // Return empty array instead of rejecting
  }
};

export const getBloodSugarReadingsForTimeRange = async (startTime: number, endTime: number): Promise<BloodSugarReading[]> => {
  try {
    const db = getDatabase();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM blood_sugar_readings WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
      [startTime, endTime]
    );
    
    const readings: BloodSugarReading[] = result.map(row => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      context: row.context,
      notes: row.notes
    }));
    
    return readings;
  } catch (error) {
    console.error('Error getting blood sugar readings for time range:', error);
    return [];  // Return empty array instead of rejecting
  }
};

export const getBloodSugarReadingsForCurrentWeek = async (): Promise<BloodSugarReading[]> => {
  const startTime = getStartOfWeek(new Date()).getTime();
  const endTime = getEndOfWeek(new Date()).getTime();
  return getBloodSugarReadingsForTimeRange(startTime, endTime);
};

// Food Entry functions
export const addFoodEntry = async (entry: Omit<FoodEntry, 'id'>): Promise<number> => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO food_entries (name, carbs, timestamp, notes) VALUES (?, ?, ?, ?)',
      [entry.name, entry.carbs || null, entry.timestamp, entry.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding food entry:', error);
    throw error;
  }
};

export const getFoodEntries = async (limit?: number): Promise<FoodEntry[]> => {
  try {
    const db = getDatabase();
    let sql = 'SELECT * FROM food_entries ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const result = await db.getAllAsync<any>(sql, params);
    
    const entries: FoodEntry[] = result.map(row => ({
      id: row.id,
      name: row.name,
      carbs: row.carbs,
      timestamp: row.timestamp,
      notes: row.notes
    }));
    
    return entries;
  } catch (error) {
    console.error('Error getting food entries:', error);
    throw error;
  }
};

export const deleteFoodEntry = async (id: number): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
};

// Insulin Dose functions
export const addInsulinDose = async (dose: Omit<InsulinDose, 'id'>): Promise<number> => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO insulin_doses (units, type, timestamp, notes) VALUES (?, ?, ?, ?)',
      [dose.units, dose.type, dose.timestamp, dose.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding insulin dose:', error);
    throw error;
  }
};

export const getInsulinDoses = async (limit?: number): Promise<InsulinDose[]> => {
  try {
    const db = getDatabase();
    let sql = 'SELECT * FROM insulin_doses ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const result = await db.getAllAsync<any>(sql, params);
    
    const doses: InsulinDose[] = result.map(row => ({
      id: row.id,
      units: row.units,
      type: row.type,
      timestamp: row.timestamp,
      notes: row.notes
    }));
    
    return doses;
  } catch (error) {
    console.error('Error getting insulin doses:', error);
    throw error;
  }
};

export const deleteInsulinDose = async (id: number): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM insulin_doses WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting insulin dose:', error);
    throw error;
  }
};

// A1C functions
export const addA1CReading = async (reading: Omit<A1CReading, 'id'>): Promise<number> => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO a1c_readings (value, timestamp, notes) VALUES (?, ?, ?)',
      [reading.value, reading.timestamp, reading.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding A1C reading:', error);
    throw error;
  }
};

export const getA1CReadings = async (limit?: number): Promise<A1CReading[]> => {
  try {
    const db = getDatabase();
    let sql = 'SELECT * FROM a1c_readings ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const result = await db.getAllAsync<any>(sql, params);
    
    const readings: A1CReading[] = result.map(row => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      notes: row.notes
    }));
    
    return readings;
  } catch (error) {
    console.error('Error getting A1C readings:', error);
    throw error;
  }
};

export const deleteA1CReading = async (id: number): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM a1c_readings WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting A1C reading:', error);
    throw error;
  }
};

// Weight functions
export const addWeightMeasurement = async (measurement: Omit<WeightMeasurement, 'id'>): Promise<number> => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO weight_measurements (value, timestamp, notes) VALUES (?, ?, ?)',
      [measurement.value, measurement.timestamp, measurement.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding weight measurement:', error);
    throw error;
  }
};

export const getWeightMeasurements = async (limit?: number): Promise<WeightMeasurement[]> => {
  try {
    const db = getDatabase();
    let sql = 'SELECT * FROM weight_measurements ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const result = await db.getAllAsync<any>(sql, params);
    
    const measurements: WeightMeasurement[] = result.map(row => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      notes: row.notes
    }));
    
    return measurements;
  } catch (error) {
    console.error('Error getting weight measurements:', error);
    throw error;
  }
};

export const deleteWeightMeasurement = async (id: number): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM weight_measurements WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting weight measurement:', error);
    throw error;
  }
};

// Blood Pressure functions
export const addBloodPressureReading = async (reading: Omit<BloodPressureReading, 'id'>): Promise<number> => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO blood_pressure_readings (systolic, diastolic, timestamp, notes) VALUES (?, ?, ?, ?)',
      [reading.systolic, reading.diastolic, reading.timestamp, reading.notes || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding blood pressure reading:', error);
    throw error;
  }
};

export const updateBloodPressureReading = async (id: number, reading: Partial<BloodPressureReading>): Promise<void> => {
  try {
    const db = getDatabase();
    const updates: string[] = [];
    const args: any[] = [];
    
    if (reading.systolic !== undefined) {
      updates.push('systolic = ?');
      args.push(reading.systolic);
    }
    if (reading.diastolic !== undefined) {
      updates.push('diastolic = ?');
      args.push(reading.diastolic);
    }
    if (reading.timestamp !== undefined) {
      updates.push('timestamp = ?');
      args.push(reading.timestamp);
    }
    if (reading.notes !== undefined) {
      updates.push('notes = ?');
      args.push(reading.notes);
    }
    
    if (updates.length === 0) {
      return;
    }
    
    args.push(id);
    
    await db.runAsync(
      `UPDATE blood_pressure_readings SET ${updates.join(', ')} WHERE id = ?`,
      args
    );
  } catch (error) {
    console.error('Error updating blood pressure reading:', error);
    throw error;
  }
};

export const getBloodPressureReadings = async (limit?: number): Promise<BloodPressureReading[]> => {
  try {
    const db = getDatabase();
    let sql = 'SELECT * FROM blood_pressure_readings ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    const result = await db.getAllAsync<any>(sql, params);
    
    const readings: BloodPressureReading[] = result.map(row => ({
      id: row.id,
      systolic: row.systolic,
      diastolic: row.diastolic,
      timestamp: row.timestamp,
      notes: row.notes
    }));
    
    return readings;
  } catch (error) {
    console.error('Error getting blood pressure readings:', error);
    throw error;
  }
};

export const deleteBloodPressureReading = async (id: number): Promise<void> => {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM blood_pressure_readings WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting blood pressure reading:', error);
    throw error;
  }
};

export const getBloodPressureReadingsForTimeRange = async (startTime: number, endTime: number): Promise<BloodPressureReading[]> => {
  try {
    const db = getDatabase();
    const result = await db.getAllAsync<any>(
      'SELECT * FROM blood_pressure_readings WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
      [startTime, endTime]
    );
    
    const readings: BloodPressureReading[] = result.map(row => ({
      id: row.id,
      systolic: row.systolic,
      diastolic: row.diastolic,
      timestamp: row.timestamp,
      notes: row.notes
    }));
    
    return readings;
  } catch (error) {
    console.error('Error getting blood pressure readings for time range:', error);
    throw error;
  }
};

/**
 * Reset the database by dropping all tables and reinitializing them
 */
export const resetDatabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Resetting database...');
    const db = getDatabase();
    
    // Drop all tables
    await db.runAsync('DROP TABLE IF EXISTS user_settings');
    await db.runAsync('DROP TABLE IF EXISTS blood_sugar_readings');
    await db.runAsync('DROP TABLE IF EXISTS food_entries');
    await db.runAsync('DROP TABLE IF EXISTS insulin_doses');
    await db.runAsync('DROP TABLE IF EXISTS a1c_readings');
    await db.runAsync('DROP TABLE IF EXISTS weight_measurements');
    await db.runAsync('DROP TABLE IF EXISTS blood_pressure_readings');
    
    // Reinitialize the database with empty tables
    await initDatabase();
    
    console.log('Database reset successfully');
    return { 
      success: true, 
      message: 'Database has been reset successfully. All data has been cleared.' 
    };
  } catch (error) {
    console.error('Error resetting database:', error);
    return { 
      success: false, 
      message: `Failed to reset database: ${error}` 
    };
  }
}; 