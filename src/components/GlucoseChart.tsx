import React from "react";
import { View } from "react-native";
import { LineChart, yAxisSides } from "react-native-gifted-charts";

const data = [{ value: 15 }, { value: 30 }, { value: 26 }];

const GlucoseChart: React.FC = () => {
  return (
    <View className="bg-gray-900 rounded-xl p-2 mx-2">
      <View className="bg-gray-900 rounded-lg p-2 relative overflow-hidden">
        <LineChart
          data={data}
          hideAxesAndRules
          color={"#FFFFFF"}
          thickness={3}
          dataPointsColor={"red"}
          spacing={100}
          yAxisSide={yAxisSides.RIGHT}
          yAxisTextStyle={{ color: "white" }}
          hideDataPoints
          focusEnabled
          showStripOnFocus
          stripHeight={195}
          showTextOnFocus
        />
      </View>
    </View>
  );
};

export default GlucoseChart;
