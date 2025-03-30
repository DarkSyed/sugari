import * as SQLite from 'expo-sqlite';
import { BloodSugarReading, FoodEntry, InsulinDose, UserSettings } from '../types';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

// Open database
const db = SQLite.openDatabaseSync('sugari.db');

// Initialize the database by creating all necessary tables
export const initDatabase = async (): Promise<void> => {
  try {
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
    
    // Check if we have at least one user_settings record
    const result = await db.execAsync('SELECT COUNT(*) as count FROM user_settings');
    const count = result?.[0]?.rows?._array?.[0]?.count || 0;
    
    if (count === 0) {
      // Create a default settings record if none exists
      await db.execAsync(`
        INSERT INTO user_settings (email, notifications, dark_mode, units) 
        VALUES (NULL, 1, 0, 'mg/dL')
      `);
    }

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
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Execute SQL query and return results
const executeQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const result = await db.execAsync(sql, params);
    return result?.[0]?.rows?._array || [];
  } catch (error) {
    console.error(`Error executing query: ${sql}`, error);
    throw error;
  }
};

// User Settings functions
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const rows = await executeQuery('SELECT * FROM user_settings LIMIT 1');
    
    if (rows.length === 0) {
      throw new Error('No user settings found');
    }
    
    const row = rows[0];
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
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
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

    if (updates.length === 0) return;

    const sql = `UPDATE user_settings SET ${updates.join(', ')} WHERE id = (SELECT id FROM user_settings LIMIT 1)`;
    await executeQuery(sql, args);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Blood Sugar Reading functions
export const addBloodSugarReading = async (reading: Omit<BloodSugarReading, 'id'>): Promise<number> => {
  try {
    const sql = 'INSERT INTO blood_sugar_readings (value, timestamp, context, notes) VALUES (?, ?, ?, ?)';
    const result = await db.execAsync(sql, [reading.value, reading.timestamp, reading.context || null, reading.notes || null]);
    return result?.insertId || 0;
  } catch (error) {
    console.error('Error adding blood sugar reading:', error);
    throw error;
  }
};

export const updateBloodSugarReading = async (id: number, reading: Partial<BloodSugarReading>): Promise<void> => {
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

    if (updates.length === 0) return;

    const sql = `UPDATE blood_sugar_readings SET ${updates.join(', ')} WHERE id = ?`;
    args.push(id);
    
    await executeQuery(sql, args);
  } catch (error) {
    console.error('Error updating blood sugar reading:', error);
    throw error;
  }
};

export const deleteBloodSugarReading = async (id: number): Promise<void> => {
  try {
    await executeQuery('DELETE FROM blood_sugar_readings WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting blood sugar reading:', error);
    throw error;
  }
};

export const getBloodSugarReadings = async (limit?: number): Promise<BloodSugarReading[]> => {
  try {
    let sql = 'SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    const rows = await executeQuery(sql);
    return rows.map(row => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      context: row.context,
      notes: row.notes
    }));
  } catch (error) {
    console.error('Error getting blood sugar readings:', error);
    return [];
  }
};

export const getBloodSugarReadingsForTimeRange = async (startTime: number, endTime: number): Promise<BloodSugarReading[]> => {
  try {
    const rows = await executeQuery(
      'SELECT * FROM blood_sugar_readings WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
      [startTime, endTime]
    );
    
    return rows.map(row => ({
      id: row.id,
      value: row.value,
      timestamp: row.timestamp,
      context: row.context,
      notes: row.notes
    }));
  } catch (error) {
    console.error('Error getting blood sugar readings for time range:', error);
    return [];
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
    const sql = 'INSERT INTO food_entries (name, carbs, timestamp, notes) VALUES (?, ?, ?, ?)';
    const result = await db.execAsync(sql, [entry.name, entry.carbs || null, entry.timestamp, entry.notes || null]);
    return result?.insertId || 0;
  } catch (error) {
    console.error('Error adding food entry:', error);
    throw error;
  }
};

export const getFoodEntries = async (limit?: number): Promise<FoodEntry[]> => {
  try {
    let sql = 'SELECT * FROM food_entries ORDER BY timestamp DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    const rows = await executeQuery(sql);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      carbs: row.carbs,
      timestamp: row.timestamp,
      notes: row.notes
    }));
  } catch (error) {
    console.error('Error getting food entries:', error);
    return [];
  }
};

// Insulin Dose functions
export const addInsulinDose = async (dose: Omit<InsulinDose, 'id'>): Promise<number> => {
  try {
    const sql = 'INSERT INTO insulin_doses (units, type, timestamp, notes) VALUES (?, ?, ?, ?)';
    const result = await db.execAsync(sql, [dose.units, dose.type, dose.timestamp, dose.notes || null]);
    return result?.insertId || 0;
  } catch (error) {
    console.error('Error adding insulin dose:', error);
    throw error;
  }
};

export const getInsulinDoses = async (limit?: number): Promise<InsulinDose[]> => {
  try {
    let sql = 'SELECT * FROM insulin_doses ORDER BY timestamp DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    const rows = await executeQuery(sql);
    return rows.map(row => ({
      id: row.id,
      units: row.units,
      type: row.type,
      timestamp: row.timestamp,
      notes: row.notes
    }));
  } catch (error) {
    console.error('Error getting insulin doses:', error);
    return [];
  }
}; 