import * as SQLite from 'expo-sqlite';
import { BloodSugarReading, FoodEntry, InsulinDose, UserSettings, A1CReading, WeightMeasurement, BloodPressureReading } from '../types';
import { getStartOfWeek, getEndOfWeek } from '../utils/dateUtils';

// Open database using the compatible method for Expo SQLite
const db = SQLite.openDatabaseSync('sugari.db');

// Initialize the database by creating all necessary tables
export const initDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        // Create user_settings table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            diabetes_type TEXT,
            notifications INTEGER DEFAULT 1,
            dark_mode INTEGER DEFAULT 0,
            units TEXT DEFAULT 'mg/dL'
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating user_settings table:', error);
            return true;
          }
        );

        // Create blood_sugar_readings table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS blood_sugar_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            value REAL NOT NULL,
            timestamp INTEGER NOT NULL,
            context TEXT,
            notes TEXT
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating blood_sugar_readings table:', error);
            return true;
          }
        );

        // Create food_entries table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS food_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            carbs REAL,
            timestamp INTEGER NOT NULL,
            notes TEXT
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating food_entries table:', error);
            return true;
          }
        );

        // Create insulin_doses table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS insulin_doses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            units REAL NOT NULL,
            type TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            notes TEXT
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating insulin_doses table:', error);
            return true;
          }
        );
        
        // Create a1c_readings table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS a1c_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            value REAL NOT NULL,
            timestamp INTEGER NOT NULL,
            notes TEXT
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating a1c_readings table:', error);
            return true;
          }
        );
        
        // Create weight_measurements table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS weight_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            value REAL NOT NULL,
            timestamp INTEGER NOT NULL,
            notes TEXT
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating weight_measurements table:', error);
            return true;
          }
        );
        
        // Create blood_pressure_readings table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS blood_pressure_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            systolic INTEGER NOT NULL,
            diastolic INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            notes TEXT
          )`,
          [],
          () => {},
          (_, error) => {
            console.error('Error creating blood_pressure_readings table:', error);
            return true;
          }
        );
        
        // Create default user settings if none exist
        tx.executeSql(
          'SELECT COUNT(*) as count FROM user_settings',
          [],
          (_, result) => {
            const count = result.rows.item(0).count;
            if (count === 0) {
              tx.executeSql(
                `INSERT INTO user_settings (email, notifications, dark_mode, units) 
                VALUES (NULL, 1, 0, 'mg/dL')`,
                [],
                () => {},
                (_, error) => {
                  console.error('Error creating default settings:', error);
                  return true;
                }
              );
            }
          },
          (_, error) => {
            console.error('Error checking user settings count:', error);
            return true;
          }
        );
      },
      (error) => {
        console.error('Error initializing database:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      });
    } catch (error) {
      console.error('Error in database initialization:', error);
      reject(error);
    }
  });
};

// User Settings functions
export const getUserSettings = async (): Promise<UserSettings> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM user_settings LIMIT 1',
        [],
        (_, result) => {
          if (result.rows.length === 0) {
            // Create default settings if none exist
            tx.executeSql(
              `INSERT INTO user_settings (email, notifications, dark_mode, units) 
              VALUES (NULL, 1, 0, 'mg/dL')`,
              [],
              (_, insertResult) => {
                // Now fetch the newly created settings
                tx.executeSql(
                  'SELECT * FROM user_settings LIMIT 1',
                  [],
                  (_, newResult) => {
                    const row = newResult.rows.item(0);
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
                  },
                  (_, error) => {
                    console.error('Error fetching new settings:', error);
                    reject(error);
                    return true;
                  }
                );
              },
              (_, error) => {
                console.error('Error creating default settings:', error);
                reject(error);
                return true;
              }
            );
          } else {
            const row = result.rows.item(0);
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
          }
        },
        (_, error) => {
          console.error('Error getting user settings:', error);
          reject(error);
          return true;
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

    db.transaction(tx => {
      tx.executeSql(
        `UPDATE user_settings SET ${updates.join(', ')} WHERE id = (SELECT id FROM user_settings LIMIT 1)`,
        args,
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error updating user settings:', error);
          reject(error);
          return true;
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
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding blood sugar reading:', error);
          reject(error);
          return true;
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

    args.push(id);

    db.transaction(tx => {
      tx.executeSql(
        `UPDATE blood_sugar_readings SET ${updates.join(', ')} WHERE id = ?`,
        args,
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error updating blood sugar reading:', error);
          reject(error);
          return true;
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
        (_, result) => {
          resolve();
        },
        (_, error) => {
          console.error('Error deleting blood sugar reading:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

export const getBloodSugarReadings = async (limit?: number): Promise<BloodSugarReading[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const readings: BloodSugarReading[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            readings.push({
              id: row.id,
              value: row.value,
              timestamp: row.timestamp,
              context: row.context,
              notes: row.notes
            });
          }
          resolve(readings);
        },
        (_, error) => {
          console.error('Error getting blood sugar readings:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
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
        (_, result) => {
          const readings: BloodSugarReading[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            readings.push({
              id: row.id,
              value: row.value,
              timestamp: row.timestamp,
              context: row.context,
              notes: row.notes
            });
          }
          resolve(readings);
        },
        (_, error) => {
          console.error('Error getting blood sugar readings for time range:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
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
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding food entry:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

export const getFoodEntries = async (limit?: number): Promise<FoodEntry[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM food_entries ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const entries: FoodEntry[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            entries.push({
              id: row.id,
              name: row.name,
              carbs: row.carbs,
              timestamp: row.timestamp,
              notes: row.notes
            });
          }
          resolve(entries);
        },
        (_, error) => {
          console.error('Error getting food entries:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
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
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding insulin dose:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

export const getInsulinDoses = async (limit?: number): Promise<InsulinDose[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM insulin_doses ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const doses: InsulinDose[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            doses.push({
              id: row.id,
              units: row.units,
              type: row.type,
              timestamp: row.timestamp,
              notes: row.notes
            });
          }
          resolve(doses);
        },
        (_, error) => {
          console.error('Error getting insulin doses:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
        }
      );
    });
  });
};

// A1C functions
export const addA1CReading = async (reading: Omit<A1CReading, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO a1c_readings (value, timestamp, notes) VALUES (?, ?, ?)',
        [reading.value, reading.timestamp, reading.notes || null],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding A1C reading:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

export const getA1CReadings = async (limit?: number): Promise<A1CReading[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM a1c_readings ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const readings: A1CReading[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            readings.push({
              id: row.id,
              value: row.value,
              timestamp: row.timestamp,
              notes: row.notes
            });
          }
          resolve(readings);
        },
        (_, error) => {
          console.error('Error getting A1C readings:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
        }
      );
    });
  });
};

// Weight functions
export const addWeightMeasurement = async (measurement: Omit<WeightMeasurement, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO weight_measurements (value, timestamp, notes) VALUES (?, ?, ?)',
        [measurement.value, measurement.timestamp, measurement.notes || null],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding weight measurement:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

export const getWeightMeasurements = async (limit?: number): Promise<WeightMeasurement[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM weight_measurements ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const measurements: WeightMeasurement[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            measurements.push({
              id: row.id,
              value: row.value,
              timestamp: row.timestamp,
              notes: row.notes
            });
          }
          resolve(measurements);
        },
        (_, error) => {
          console.error('Error getting weight measurements:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
        }
      );
    });
  });
};

// Blood Pressure functions
export const addBloodPressureReading = async (reading: Omit<BloodPressureReading, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO blood_pressure_readings (systolic, diastolic, timestamp, notes) VALUES (?, ?, ?, ?)',
        [reading.systolic, reading.diastolic, reading.timestamp, reading.notes || null],
        (_, result) => {
          resolve(result.insertId);
        },
        (_, error) => {
          console.error('Error adding blood pressure reading:', error);
          reject(error);
          return true;
        }
      );
    });
  });
};

export const getBloodPressureReadings = async (limit?: number): Promise<BloodPressureReading[]> => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM blood_pressure_readings ORDER BY timestamp DESC';
    const params: any[] = [];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }
    
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const readings: BloodPressureReading[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            readings.push({
              id: row.id,
              systolic: row.systolic,
              diastolic: row.diastolic,
              timestamp: row.timestamp,
              notes: row.notes
            });
          }
          resolve(readings);
        },
        (_, error) => {
          console.error('Error getting blood pressure readings:', error);
          resolve([]);  // Resolve with empty array instead of rejecting
          return true;
        }
      );
    });
  });
}; 