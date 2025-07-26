import React from "react";
import DashHeader from "../../components/DashHeader";
import GlucoseChart from "../../components/GlucoseChart";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <DashHeader />
      <GlucoseChart />
    </SafeAreaView>
  );
};

export default DashboardScreen;
