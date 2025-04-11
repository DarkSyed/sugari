import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BloodSugarReading } from '../types';
import { COLORS, SIZES, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX } from '../constants';
import Card from './Card';

interface GlucoseChartProps {
  data: BloodSugarReading[];
  title?: string;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  onDataPointPress?: (reading: BloodSugarReading) => void;
}

const GlucoseChart: React.FC<GlucoseChartProps> = ({
  data,
  title = 'Blood Glucose Trends',
  timeRange = '24h',
  onDataPointPress,
}) => {
  // Use full width minus padding to ensure proper alignment
  const screenWidth = Dimensions.get('window').width - (SIZES.md * 4);
  
  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const filteredData = sortedData.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      switch (timeRange) {
        case '24h':
          return now.getTime() - readingDate.getTime() <= 24 * 60 * 60 * 1000;
        case '7d':
          return now.getTime() - readingDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return now.getTime() - readingDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
        case 'all':
          return true;
        default:
          return now.getTime() - readingDate.getTime() <= 24 * 60 * 60 * 1000;
      }
    });
    
    // If filtered data is empty, return at least one item for the chart
    return filteredData.length > 0 
      ? filteredData 
      : sortedData.length > 0 
        ? [sortedData[sortedData.length - 1]] 
        : [];
  };

  const filteredData = getFilteredData();

  // Extract values and labels
  const values = filteredData.map(reading => reading.value);
  
  // Format timestamps for labels
  const labels = filteredData.map(reading => {
    const date = new Date(reading.timestamp);
    switch (timeRange) {
      case '24h':
        return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
      case '7d':
      case '30d':
        return date.getMonth() + 1 + '/' + date.getDate();
      case 'all':
        return date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear().toString().substr(-2);
      default:
        return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    }
  });

  // Calculate statistics
  const average = values.length > 0 
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) 
    : 0;
  
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  
  const inRangeCount = values.filter(
    value => value >= NORMAL_SUGAR_MIN && value <= NORMAL_SUGAR_MAX
  ).length;
  
  const inRangePercentage = values.length > 0 
    ? Math.round((inRangeCount / values.length) * 100) 
    : 0;

  // Handle data point press
  const handleDataPointClick = (data: any) => {
    if (onDataPointPress && filteredData[data.index]) {
      onDataPointPress(filteredData[data.index]);
    }
  };

  // If no data, display a message
  if (filteredData.length === 0) {
    return (
      <Card variant="elevated">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No glucose data available</Text>
          <Text style={styles.emptySubText}>
            Start logging your readings to see trends
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="elevated" style={styles.cardWithoutPadding}>
      <View style={styles.container}>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: values,
                color: () => COLORS.primary,
                strokeWidth: 2,
              },
              {
                data: [NORMAL_SUGAR_MIN, NORMAL_SUGAR_MIN],
                color: () => COLORS.success + '80', // 50% opacity
                strokeWidth: 1,
                withDots: false,
              },
              {
                data: [NORMAL_SUGAR_MAX, NORMAL_SUGAR_MAX],
                color: () => COLORS.success + '80', // 50% opacity
                strokeWidth: 1,
                withDots: false,
              },
            ],
          }}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: () => COLORS.primary,
            labelColor: () => COLORS.text,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '5',
              strokeWidth: '1',
              stroke: COLORS.primary,
            },
            propsForBackgroundLines: {
              stroke: COLORS.border,
              strokeWidth: 1,
            },
            formatYLabel: (yValue) => `${yValue}`,
          }}
          bezier
          style={styles.chart}
          fromZero={false}
          segments={5}
          onDataPointClick={handleDataPointClick}
          verticalLabelRotation={30}
        />
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{average}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inRangePercentage}%</Text>
            <Text style={styles.statLabel}>In Range</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{min}</Text>
            <Text style={styles.statLabel}>Min</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{max}</Text>
            <Text style={styles.statLabel}>Max</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.md,
    alignItems: 'center',
  },
  cardWithoutPadding: {
    padding: 0, // Override the default padding from the Card component
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SIZES.sm,
    color: COLORS.text,
  },
  chart: {
    marginVertical: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
  },
});

export default GlucoseChart;
