import { SQLiteDatabase } from 'expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { BloodSugarReading, FoodEntry, InsulinDose, UserSettings } from '../types';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

// Open database - use the version that matches your Expo version
let db: SQLiteDatabase;

try {
  db = SQLite.openDatabaseSync('sugari.db');
  console.log('Successfully opened the database');
} catch (error) {
  console.error('Failed to open database:', error);
  throw error;
}

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
    const count = result[0].rows[0]?.count || 0;
    
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

// User Settings functions
export const getUserSettings = async (): Promise<UserSettings> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM user_settings LIMIT 1',
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const row = rows._array[0];
            resolve({
              id: row.id,
              email: row.email,
              firstName: row.first_name,
              lastName: row.last_name,
              diabetesType: row.diabetes_type,
              notifications: Boolean(row.notifications),
              darkMode: Boolean(row.dark_mode),
              units: row.units
            });
          } else {
            reject(new Error('No user settings found'));
          }
        },
        (_, error) => {
          console.error('Error getting user settings:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  return new Promise((resolve, reject) => {
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

    const sql = `UPDATE user_settings SET ${updates.join(', ')} WHERE id = (SELECT id FROM user_settings LIMIT 1)`;
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        args,
        () => {
          resolve();
        },
        (_, error) => {
          console.error('Error updating user settings:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Blood Sugar Reading functions
export const addBloodSugarReading = async (reading: Omit<BloodSugarReading, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO blood_sugar_readings (value, timestamp, context, notes) VALUES (?, ?, ?, ?)',
        [reading.value, reading.timestamp, reading.context || null, reading.notes || null],
        (_, { insertId }) => {
          resolve(insertId);
        },
        (_, error) => {
          console.error('Error adding blood sugar reading:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateBloodSugarReading = async (id: number, reading: Partial<BloodSugarReading>): Promise<void> => {
  return new Promise((resolve, reject) => {
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

    const sql = `UPDATE blood_sugar_readings SET ${updates.join(', ')} WHERE id = ?`;
    args.push(id);
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        args,
        () => {
          resolve();
        },
        (_, error) => {
          console.error('Error updating blood sugar reading:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteBloodSugarReading = async (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM blood_sugar_readings WHERE id = ?',
        [id],
        () => {
          resolve();
        },
        (_, error) => {
          console.error('Error deleting blood sugar reading:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getBloodSugarReadings = async (limit?: number): Promise<BloodSugarReading[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        [],
        (_, { rows }) => {
          const readings = rows._array.map(row => ({
            id: row.id,
            value: row.value,
            timestamp: row.timestamp,
            context: row.context,
            notes: row.notes
          }));
          resolve(readings);
        },
        (_, error) => {
          console.error('Error getting blood sugar readings:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getBloodSugarReadingsForTimeRange = async (startTime: number, endTime: number): Promise<BloodSugarReading[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM blood_sugar_readings WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
        [startTime, endTime],
        (_, { rows }) => {
          const readings = rows._array.map(row => ({
            id: row.id,
            value: row.value,
            timestamp: row.timestamp,
            context: row.context,
            notes: row.notes
          }));
          resolve(readings);
        },
        (_, error) => {
          console.error('Error getting blood sugar readings for time range:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getBloodSugarReadingsForCurrentWeek = async (): Promise<BloodSugarReading[]> => {
  const startTime = getStartOfWeek(new Date()).getTime();
  const endTime = getEndOfWeek(new Date()).getTime();
  return getBloodSugarReadingsForTimeRange(startTime, endTime);
};

// Food Entry functions
export const addFoodEntry = async (entry: Omit<FoodEntry, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO food_entries (name, carbs, timestamp, notes) VALUES (?, ?, ?, ?)',
        [entry.name, entry.carbs || null, entry.timestamp, entry.notes || null],
        (_, { insertId }) => {
          resolve(insertId);
        },
        (_, error) => {
          console.error('Error adding food entry:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getFoodEntries = async (limit?: number): Promise<FoodEntry[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM food_entries ORDER BY timestamp DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        [],
        (_, { rows }) => {
          const entries = rows._array.map(row => ({
            id: row.id,
            name: row.name,
            carbs: row.carbs,
            timestamp: row.timestamp,
            notes: row.notes
          }));
          resolve(entries);
        },
        (_, error) => {
          console.error('Error getting food entries:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Insulin Dose functions
export const addInsulinDose = async (dose: Omit<InsulinDose, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO insulin_doses (units, type, timestamp, notes) VALUES (?, ?, ?, ?)',
        [dose.units, dose.type, dose.timestamp, dose.notes || null],
        (_, { insertId }) => {
          resolve(insertId);
        },
        (_, error) => {
          console.error('Error adding insulin dose:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getInsulinDoses = async (limit?: number): Promise<InsulinDose[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM insulin_doses ORDER BY timestamp DESC';
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        [],
        (_, { rows }) => {
          const doses = rows._array.map(row => ({
            id: row.id,
            units: row.units,
            type: row.type,
            timestamp: row.timestamp,
            notes: row.notes
          }));
          resolve(doses);
        },
        (_, error) => {
          console.error('Error getting insulin doses:', error);
          reject(error);
          return false;
        }
      );
    });
  });
}; 