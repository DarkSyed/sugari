import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { 
  BloodSugarReading, 
  InsulinDose, 
  FoodEntry, 
  A1CReading, 
  WeightMeasurement, 
  BloodPressureReading,
  UserSettings
} from '../types';
import { 
  calculateBloodSugarStats, 
  calculateInsulinStats, 
  calculateFoodStats,
  formatDate,
  formatDateTime,
  groupReadingsByDay,
  calculateBMI,
  getBMICategory
} from './reportService';

// Define the directory for storing PDF files
const PDF_DIR = `${FileSystem.documentDirectory}reports`;

// Ensure the directory exists
export const ensureDirectoryExists = async () => {
  try {
    const dirExists = await FileSystem.getInfoAsync(PDF_DIR);
    if (!dirExists.exists) {
      await FileSystem.makeDirectoryAsync(PDF_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error ensuring directory exists:', error);
    throw error;
  }
};

// Generate HTML content for the PDF
export const generateHTMLContent = (
  bloodSugarReadings: BloodSugarReading[],
  insulinDoses: InsulinDose[],
  foodEntries: FoodEntry[],
  a1cReadings: A1CReading[],
  weightMeasurements: WeightMeasurement[],
  bloodPressureReadings: BloodPressureReading[],
  userSettings: UserSettings,
  startDate: Date,
  endDate: Date
) => {
  // Calculate statistics
  const bloodSugarStats = calculateBloodSugarStats(bloodSugarReadings);
  const insulinStats = calculateInsulinStats(insulinDoses);
  const foodStats = calculateFoodStats(foodEntries);
  
  // Get the latest weight and height if available
  const latestWeight = weightMeasurements.length > 0 
    ? weightMeasurements.sort((a, b) => b.timestamp - a.timestamp)[0].value 
    : null;
  
  // Calculate BMI if weight and height are available
  const height = userSettings.height || null;
  const bmi = (latestWeight && height) 
    ? calculateBMI(latestWeight, height) 
    : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  
  // Group blood sugar readings by day
  const readingsByDay = groupReadingsByDay(bloodSugarReadings);
  
  // Generate HTML content
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Sugari Health Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        .title {
          font-size: 20px;
          margin: 10px 0;
        }
        .date-range {
          font-size: 16px;
          color: #666;
        }
        .user-info {
          margin: 20px 0;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        .section {
          margin: 25px 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #0066cc;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .stats-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .stat-box {
          width: 30%;
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #0066cc;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
          color: #333;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Sugari</div>
        <h1 class="title">Health Report</h1>
        <p class="date-range">${formatDate(startDate.getTime())} - ${formatDate(endDate.getTime())}</p>
      </div>
      
      <div class="user-info">
        <p><strong>Name:</strong> ${userSettings.firstName || ''} ${userSettings.lastName || ''}</p>
        <p><strong>Email:</strong> ${userSettings.email || 'Not provided'}</p>
        <p><strong>Diabetes Type:</strong> ${userSettings.diabetesType || 'Not specified'}</p>
        ${latestWeight ? `<p><strong>Weight:</strong> ${latestWeight} kg</p>` : ''}
        ${height ? `<p><strong>Height:</strong> ${height} cm</p>` : ''}
        ${bmi ? `<p><strong>BMI:</strong> ${bmi} (${bmiCategory})</p>` : ''}
      </div>
      
      <div class="section">
        <h2 class="section-title">Blood Sugar Overview</h2>
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-title">Average</div>
            <div class="stat-value">${bloodSugarStats.average} ${userSettings.units || 'mg/dL'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Lowest</div>
            <div class="stat-value">${bloodSugarStats.min} ${userSettings.units || 'mg/dL'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Highest</div>
            <div class="stat-value">${bloodSugarStats.max} ${userSettings.units || 'mg/dL'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">In Range</div>
            <div class="stat-value">${bloodSugarStats.inRangePercentage}%</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">High</div>
            <div class="stat-value">${bloodSugarStats.highPercentage}%</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Low</div>
            <div class="stat-value">${bloodSugarStats.lowPercentage}%</div>
          </div>
        </div>
        
        <h3>Blood Sugar Readings</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Value</th>
              <th>Context</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${bloodSugarReadings.map(reading => `
              <tr>
                <td>${formatDateTime(reading.timestamp)}</td>
                <td>${reading.value} ${userSettings.units || 'mg/dL'}</td>
                <td>${reading.context || '-'}</td>
                <td>${reading.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2 class="section-title">Insulin Overview</h2>
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-title">Total Insulin</div>
            <div class="stat-value">${insulinStats.totalInsulin} units</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Average Per Day</div>
            <div class="stat-value">${insulinStats.averagePerDay} units</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Number of Doses</div>
            <div class="stat-value">${insulinStats.dosesCount}</div>
          </div>
        </div>
        
        <h3>Insulin Doses</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Units</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${insulinDoses.map(dose => `
              <tr>
                <td>${formatDateTime(dose.timestamp)}</td>
                <td>${dose.units}</td>
                <td>${dose.type}</td>
                <td>${dose.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2 class="section-title">Food Overview</h2>
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-title">Total Carbs</div>
            <div class="stat-value">${foodStats.totalCarbs} g</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Average Per Day</div>
            <div class="stat-value">${foodStats.averageCarbsPerDay} g</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">Number of Entries</div>
            <div class="stat-value">${foodStats.entriesCount}</div>
          </div>
        </div>
        
        <h3>Food Entries</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Food</th>
              <th>Carbs (g)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${foodEntries.map(entry => `
              <tr>
                <td>${formatDateTime(entry.timestamp)}</td>
                <td>${entry.name}</td>
                <td>${entry.carbs || '-'}</td>
                <td>${entry.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${a1cReadings.length > 0 ? `
        <div class="section">
          <h2 class="section-title">A1C Readings</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Value (%)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${a1cReadings.map(reading => `
                <tr>
                  <td>${formatDate(reading.timestamp)}</td>
                  <td>${reading.value}</td>
                  <td>${reading.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${weightMeasurements.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Weight Measurements</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${weightMeasurements.map(measurement => `
                <tr>
                  <td>${formatDate(measurement.timestamp)}</td>
                  <td>${measurement.value}</td>
                  <td>${measurement.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${bloodPressureReadings.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Blood Pressure Readings</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Systolic</th>
                <th>Diastolic</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${bloodPressureReadings.map(reading => `
                <tr>
                  <td>${formatDate(reading.timestamp)}</td>
                  <td>${reading.systolic}</td>
                  <td>${reading.diastolic}</td>
                  <td>${reading.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 50px; color: #999; font-size: 12px;">
        <p>Generated by Sugari on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;
};

// Generate PDF file
export const generatePDF = async (
  bloodSugarReadings: BloodSugarReading[],
  insulinDoses: InsulinDose[],
  foodEntries: FoodEntry[],
  a1cReadings: A1CReading[],
  weightMeasurements: WeightMeasurement[],
  bloodPressureReadings: BloodPressureReading[],
  userSettings: UserSettings,
  startDate: Date,
  endDate: Date
): Promise<string> => {
  try {
    // Ensure the directory exists
    await ensureDirectoryExists();
    
    // Generate HTML content
    const htmlContent = generateHTMLContent(
      bloodSugarReadings,
      insulinDoses,
      foodEntries,
      a1cReadings,
      weightMeasurements,
      bloodPressureReadings,
      userSettings,
      startDate,
      endDate
    );
    
    // Generate file name
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const fileName = `sugari_report_${startDateStr}_to_${endDateStr}.pdf`;
    const filePath = `${PDF_DIR}/${fileName}`;
    
    // Use Print module to generate the PDF
    const { uri } = await Print.printToFileAsync({ 
      html: htmlContent,
      base64: false
    });
    
    // Move the file to our reports directory
    await FileSystem.moveAsync({
      from: uri,
      to: filePath
    });
    
    return filePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Generate CSV content
export const generateCSVContent = (
  bloodSugarReadings: BloodSugarReading[],
  insulinDoses: InsulinDose[],
  foodEntries: FoodEntry[],
  a1cReadings: A1CReading[],
  weightMeasurements: WeightMeasurement[],
  bloodPressureReadings: BloodPressureReading[]
) => {
  // Blood sugar readings CSV
  let bloodSugarCSV = 'Date,Time,Value,Context,Notes\n';
  bloodSugarReadings.forEach(reading => {
    const date = formatDate(reading.timestamp);
    const time = formatDateTime(reading.timestamp).split(' ')[1];
    bloodSugarCSV += `${date},${time},${reading.value},"${reading.context || ''}","${reading.notes?.replace(/"/g, '""') || ''}"\n`;
  });
  
  // Insulin doses CSV
  let insulinCSV = 'Date,Time,Units,Type,Notes\n';
  insulinDoses.forEach(dose => {
    const date = formatDate(dose.timestamp);
    const time = formatDateTime(dose.timestamp).split(' ')[1];
    insulinCSV += `${date},${time},${dose.units},"${dose.type}","${dose.notes?.replace(/"/g, '""') || ''}"\n`;
  });
  
  // Food entries CSV
  let foodCSV = 'Date,Time,Name,Carbs,Notes\n';
  foodEntries.forEach(entry => {
    const date = formatDate(entry.timestamp);
    const time = formatDateTime(entry.timestamp).split(' ')[1];
    foodCSV += `${date},${time},"${entry.name}",${entry.carbs || ''},"${entry.notes?.replace(/"/g, '""') || ''}"\n`;
  });
  
  // A1C readings CSV
  let a1cCSV = 'Date,Value,Notes\n';
  a1cReadings.forEach(reading => {
    const date = formatDate(reading.timestamp);
    a1cCSV += `${date},${reading.value},"${reading.notes?.replace(/"/g, '""') || ''}"\n`;
  });
  
  // Weight measurements CSV
  let weightCSV = 'Date,Value,Notes\n';
  weightMeasurements.forEach(measurement => {
    const date = formatDate(measurement.timestamp);
    weightCSV += `${date},${measurement.value},"${measurement.notes?.replace(/"/g, '""') || ''}"\n`;
  });
  
  // Blood pressure readings CSV
  let bpCSV = 'Date,Systolic,Diastolic,Notes\n';
  bloodPressureReadings.forEach(reading => {
    const date = formatDate(reading.timestamp);
    bpCSV += `${date},${reading.systolic},${reading.diastolic},"${reading.notes?.replace(/"/g, '""') || ''}"\n`;
  });
  
  return {
    bloodSugarCSV,
    insulinCSV,
    foodCSV,
    a1cCSV,
    weightCSV,
    bpCSV
  };
};

// Generate CSV files
export const generateCSV = async (
  bloodSugarReadings: BloodSugarReading[],
  insulinDoses: InsulinDose[],
  foodEntries: FoodEntry[],
  a1cReadings: A1CReading[],
  weightMeasurements: WeightMeasurement[],
  bloodPressureReadings: BloodPressureReading[],
  startDate: Date,
  endDate: Date
): Promise<string[]> => {
  try {
    // Ensure the directory exists
    await ensureDirectoryExists();
    
    // Generate CSV content
    const csvContent = generateCSVContent(
      bloodSugarReadings,
      insulinDoses,
      foodEntries,
      a1cReadings,
      weightMeasurements,
      bloodPressureReadings
    );
    
    // Generate file names
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const baseFileName = `sugari_data_${startDateStr}_to_${endDateStr}`;
    
    // Write CSV files
    const filePaths: string[] = [];
    
    if (bloodSugarReadings.length > 0) {
      const bloodSugarPath = `${PDF_DIR}/${baseFileName}_blood_sugar.csv`;
      await FileSystem.writeFileAsync(bloodSugarPath, csvContent.bloodSugarCSV, { encoding: FileSystem.EncodingType.UTF8 });
      filePaths.push(bloodSugarPath);
    }
    
    if (insulinDoses.length > 0) {
      const insulinPath = `${PDF_DIR}/${baseFileName}_insulin.csv`;
      await FileSystem.writeFileAsync(insulinPath, csvContent.insulinCSV, { encoding: FileSystem.EncodingType.UTF8 });
      filePaths.push(insulinPath);
    }
    
    if (foodEntries.length > 0) {
      const foodPath = `${PDF_DIR}/${baseFileName}_food.csv`;
      await FileSystem.writeFileAsync(foodPath, csvContent.foodCSV, { encoding: FileSystem.EncodingType.UTF8 });
      filePaths.push(foodPath);
    }
    
    if (a1cReadings.length > 0) {
      const a1cPath = `${PDF_DIR}/${baseFileName}_a1c.csv`;
      await FileSystem.writeFileAsync(a1cPath, csvContent.a1cCSV, { encoding: FileSystem.EncodingType.UTF8 });
      filePaths.push(a1cPath);
    }
    
    if (weightMeasurements.length > 0) {
      const weightPath = `${PDF_DIR}/${baseFileName}_weight.csv`;
      await FileSystem.writeFileAsync(weightPath, csvContent.weightCSV, { encoding: FileSystem.EncodingType.UTF8 });
      filePaths.push(weightPath);
    }
    
    if (bloodPressureReadings.length > 0) {
      const bpPath = `${PDF_DIR}/${baseFileName}_blood_pressure.csv`;
      await FileSystem.writeFileAsync(bpPath, csvContent.bpCSV, { encoding: FileSystem.EncodingType.UTF8 });
      filePaths.push(bpPath);
    }
    
    return filePaths;
  } catch (error) {
    console.error('Error generating CSV files:', error);
    throw error;
  }
};