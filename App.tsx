import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "./src/contexts/AppContext";
import AppNavigator from "./src/navigation";
import { initDatabase } from "./src/services/database";
import "./global.css";

export default function App() {
  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        console.log("Database initialized successfully");
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };

    setup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
