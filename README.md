# Sugari - Diabetes Management App

Sugari is a personalized digital health assistant designed to help individuals with diabetes effectively manage their blood sugar levels. The app provides tailored dietary and lifestyle advice, visualizes health data, and offers actionable insights through AI-driven analysis.

## Features

- **User Authentication**: Secure sign-up and login with Supabase Authentication
- **Blood Sugar Logging**: Easily record and track your blood glucose readings
- **Personalized Insights**: Get tailored recommendations based on your health data
- **Data Visualization**: View your blood glucose trends over time with intuitive charts
- **Quick Actions**: Quickly log new readings, food entries, and insulin doses

## Tech Stack

- **Frontend**: React Native with Expo, TypeScript
- **Backend**: Supabase (PostgreSQL database, authentication, and edge functions)
- **State Management**: React Context API
- **Forms**: react-hook-form with TypeScript
- **Navigation**: React Navigation
- **Data Visualization**: react-native-chart-kit
- **AI Integration**: Rule-based system (initially), with plans for OpenAI API integration

## Setup Instructions

1. Make sure you have Node.js and npm installed
2. Install Expo CLI: `npm install -g expo-cli`
3. Clone this repository
4. Navigate to the project directory and install dependencies:
   ```
   npm install
   ```
5. Update Supabase credentials in `src/constants/index.ts`:
   ```javascript
   export const SUPABASE_URL = "YOUR_SUPABASE_URL";
   export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```
6. Start the development server:
   ```
   npx expo start
   ```

## Database Schema

Sugari uses the following database tables:

- **profiles**: User profile information
- **blood_glucose**: Blood glucose readings
- **food_entries**: Food and carbohydrate intake
- **insulin_doses**: Insulin dosing records
- **user_settings**: User preferences and settings

## Development Roadmap

- [ ] Complete implementation of food and insulin logging
- [ ] Add CGM (Continuous Glucose Monitor) integration
- [ ] Implement advanced analytics and reporting
- [ ] Integrate with fitness trackers
- [ ] Add medication reminders
- [ ] Implement barcode scanning for food logging

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

---

### Requirements

- Node.js 14+
- Expo CLI
- Supabase account
- OpenAI API key (for future AI features) 