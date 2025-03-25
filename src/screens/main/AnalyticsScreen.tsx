import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, NORMAL_GLUCOSE_MIN, NORMAL_GLUCOSE_MAX } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { BloodGlucoseReading } from '../../types';
import { getBloodGlucoseReadings } from '../../services/supabase';
import Container from '../../components/Container';
import Card from '../../components/Card';
import GlucoseChart from '../../components/GlucoseChart';

const AnalyticsScreen: React.FC = () => {
  const { authState } = useAuth();
  const [readings, setReadings] = useState<BloodGlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedStatistic, setSelectedStatistic] = useState<'overview' | 'time-of-day' | 'meal-impact'>('overview');

  const fetchGlucoseReadings = useCallback(async () => {
    if (!authState.user) return;

    try {
      const { data, error } = await getBloodGlucoseReadings(authState.user.id);
      
      if (error) {
        console.error('Error fetching glucose readings:', error);
      } else if (data) {
        setReadings(data);
      }
    } catch (error) {
      console.error('Error fetching glucose readings:', error);
    } finally {
      setLoading(false);
    }
  }, [authState.user]);

  useEffect(() => {
    fetchGlucoseReadings();
  }, [fetchGlucoseReadings]);

  // Filter readings based on time range
  const getFilteredReadings = () => {
    const now = new Date();
    return readings.filter(reading => {
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
          return true;
      }
    });
  };

  const filteredReadings = getFilteredReadings();

  // Calculate statistics
  const calculateStats = () => {
    if (filteredReadings.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        inRange: 0,
        below: 0,
        above: 0,
        timeInRange: 0,
        standardDeviation: 0,
        readingsCount: 0
      };
    }

    const values = filteredReadings.map(r => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const inRangeCount = values.filter(v => v >= NORMAL_GLUCOSE_MIN && v <= NORMAL_GLUCOSE_MAX).length;
    const belowCount = values.filter(v => v < NORMAL_GLUCOSE_MIN).length;
    const aboveCount = values.filter(v => v > NORMAL_GLUCOSE_MAX).length;
    
    const timeInRange = Math.round((inRangeCount / values.length) * 100);
    
    // Calculate standard deviation
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    const stdDev = Math.round(Math.sqrt(variance));

    return {
      average: avg,
      min,
      max,
      inRange: inRangeCount,
      below: belowCount,
      above: aboveCount,
      timeInRange,
      standardDeviation: stdDev,
      readingsCount: values.length
    };
  };

  const stats = calculateStats();

  // Group readings by time of day
  const getTimeOfDayData = () => {
    const morning = filteredReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 5 && hour < 12;
    });
    
    const afternoon = filteredReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 12 && hour < 18;
    });
    
    const evening = filteredReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 18 && hour < 22;
    });
    
    const night = filteredReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 22 || hour < 5;
    });

    return {
      morning: {
        avg: morning.length ? Math.round(morning.reduce((a, b) => a + b.value, 0) / morning.length) : 0,
        count: morning.length
      },
      afternoon: {
        avg: afternoon.length ? Math.round(afternoon.reduce((a, b) => a + b.value, 0) / afternoon.length) : 0,
        count: afternoon.length
      },
      evening: {
        avg: evening.length ? Math.round(evening.reduce((a, b) => a + b.value, 0) / evening.length) : 0,
        count: evening.length
      },
      night: {
        avg: night.length ? Math.round(night.reduce((a, b) => a + b.value, 0) / night.length) : 0,
        count: night.length
      }
    };
  };

  const timeOfDayData = getTimeOfDayData();

  // Group readings by meal context
  const getMealContextData = () => {
    const beforeMeal = filteredReadings.filter(r => r.mealContext === 'before_meal');
    const afterMeal = filteredReadings.filter(r => r.mealContext === 'after_meal');
    const fasting = filteredReadings.filter(r => r.mealContext === 'fasting');
    const bedtime = filteredReadings.filter(r => r.mealContext === 'bedtime');
    const other = filteredReadings.filter(r => r.mealContext === 'other' || !r.mealContext);

    return {
      beforeMeal: {
        avg: beforeMeal.length ? Math.round(beforeMeal.reduce((a, b) => a + b.value, 0) / beforeMeal.length) : 0,
        count: beforeMeal.length
      },
      afterMeal: {
        avg: afterMeal.length ? Math.round(afterMeal.reduce((a, b) => a + b.value, 0) / afterMeal.length) : 0,
        count: afterMeal.length
      },
      fasting: {
        avg: fasting.length ? Math.round(fasting.reduce((a, b) => a + b.value, 0) / fasting.length) : 0,
        count: fasting.length
      },
      bedtime: {
        avg: bedtime.length ? Math.round(bedtime.reduce((a, b) => a + b.value, 0) / bedtime.length) : 0,
        count: bedtime.length
      },
      other: {
        avg: other.length ? Math.round(other.reduce((a, b) => a + b.value, 0) / other.length) : 0,
        count: other.length
      }
    };
  };

  const mealContextData = getMealContextData();

  const renderTabButton = (label: string, tab: 'overview' | 'time-of-day' | 'meal-impact') => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedStatistic === tab && styles.tabButtonActive,
      ]}
      onPress={() => setSelectedStatistic(tab)}
    >
      <Text
        style={[
          styles.tabButtonText,
          selectedStatistic === tab && styles.tabButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeRangeButton = (label: string, range: '24h' | '7d' | '30d' | 'all') => (
    <TouchableOpacity
      style={[
        styles.timeRangeButton,
        timeRange === range && styles.timeRangeButtonActive,
      ]}
      onPress={() => setTimeRange(range)}
    >
      <Text
        style={[
          styles.timeRangeText,
          timeRange === range && styles.timeRangeTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionSubtitle}>Summary Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.average}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.timeInRange}%</Text>
          <Text style={styles.statLabel}>Time in Range</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.standardDeviation}</Text>
          <Text style={styles.statLabel}>Std Dev</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.readingsCount}</Text>
          <Text style={styles.statLabel}>Readings</Text>
        </View>
      </View>

      <View style={styles.rangeStats}>
        <View style={styles.rangeStatBar}>
          <View 
            style={[
              styles.rangeStatSegment, 
              { 
                backgroundColor: COLORS.warning,
                flex: stats.below / stats.readingsCount || 0 
              }
            ]} 
          />
          <View 
            style={[
              styles.rangeStatSegment, 
              { 
                backgroundColor: COLORS.success,
                flex: stats.inRange / stats.readingsCount || 0 
              }
            ]} 
          />
          <View 
            style={[
              styles.rangeStatSegment, 
              { 
                backgroundColor: COLORS.error,
                flex: stats.above / stats.readingsCount || 0 
              }
            ]} 
          />
        </View>
        
        <View style={styles.rangeStatLabels}>
          <View style={styles.rangeStatLabel}>
            <View style={[styles.rangeDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.rangeText}>Low</Text>
            <Text style={styles.rangeCount}>{stats.below}</Text>
          </View>
          
          <View style={styles.rangeStatLabel}>
            <View style={[styles.rangeDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.rangeText}>In Range</Text>
            <Text style={styles.rangeCount}>{stats.inRange}</Text>
          </View>
          
          <View style={styles.rangeStatLabel}>
            <View style={[styles.rangeDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.rangeText}>High</Text>
            <Text style={styles.rangeCount}>{stats.above}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>Glucose Range</Text>
      <View style={styles.minMaxContainer}>
        <View style={styles.minMaxItem}>
          <Text style={styles.minMaxLabel}>Lowest</Text>
          <Text style={styles.minMaxValue}>{stats.min}</Text>
          <Text style={styles.minMaxUnit}>mg/dL</Text>
        </View>
        
        <View style={styles.verticalDivider} />
        
        <View style={styles.minMaxItem}>
          <Text style={styles.minMaxLabel}>Highest</Text>
          <Text style={styles.minMaxValue}>{stats.max}</Text>
          <Text style={styles.minMaxUnit}>mg/dL</Text>
        </View>
      </View>
    </View>
  );

  const renderTimeOfDayTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionSubtitle}>Average by Time of Day</Text>
      
      <View style={styles.timeOfDayContainer}>
        <View style={styles.timeOfDayItem}>
          <View style={styles.timeOfDayIconContainer}>
            <Text style={styles.timeOfDayIcon}>🌅</Text>
          </View>
          <Text style={styles.timeOfDayName}>Morning</Text>
          <Text style={styles.timeOfDayValue}>{timeOfDayData.morning.avg}</Text>
          <Text style={styles.timeOfDayReadings}>{timeOfDayData.morning.count} readings</Text>
        </View>
        
        <View style={styles.timeOfDayItem}>
          <View style={styles.timeOfDayIconContainer}>
            <Text style={styles.timeOfDayIcon}>☀️</Text>
          </View>
          <Text style={styles.timeOfDayName}>Afternoon</Text>
          <Text style={styles.timeOfDayValue}>{timeOfDayData.afternoon.avg}</Text>
          <Text style={styles.timeOfDayReadings}>{timeOfDayData.afternoon.count} readings</Text>
        </View>
        
        <View style={styles.timeOfDayItem}>
          <View style={styles.timeOfDayIconContainer}>
            <Text style={styles.timeOfDayIcon}>🌆</Text>
          </View>
          <Text style={styles.timeOfDayName}>Evening</Text>
          <Text style={styles.timeOfDayValue}>{timeOfDayData.evening.avg}</Text>
          <Text style={styles.timeOfDayReadings}>{timeOfDayData.evening.count} readings</Text>
        </View>
        
        <View style={styles.timeOfDayItem}>
          <View style={styles.timeOfDayIconContainer}>
            <Text style={styles.timeOfDayIcon}>🌙</Text>
          </View>
          <Text style={styles.timeOfDayName}>Night</Text>
          <Text style={styles.timeOfDayValue}>{timeOfDayData.night.avg}</Text>
          <Text style={styles.timeOfDayReadings}>{timeOfDayData.night.count} readings</Text>
        </View>
      </View>

      <Text style={styles.insightText}>
        {getTimeOfDayInsight()}
      </Text>
    </View>
  );

  const renderMealImpactTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionSubtitle}>Average by Meal Context</Text>
      
      <View style={styles.mealContextContainer}>
        <View style={styles.mealContextItem}>
          <View style={styles.mealContextIconContainer}>
            <Text style={styles.mealContextIcon}>🍽️</Text>
          </View>
          <Text style={styles.mealContextName}>Before Meal</Text>
          <Text style={styles.mealContextValue}>{mealContextData.beforeMeal.avg}</Text>
          <Text style={styles.mealContextReadings}>{mealContextData.beforeMeal.count} readings</Text>
        </View>
        
        <View style={styles.mealContextItem}>
          <View style={styles.mealContextIconContainer}>
            <Text style={styles.mealContextIcon}>🍴</Text>
          </View>
          <Text style={styles.mealContextName}>After Meal</Text>
          <Text style={styles.mealContextValue}>{mealContextData.afterMeal.avg}</Text>
          <Text style={styles.mealContextReadings}>{mealContextData.afterMeal.count} readings</Text>
        </View>
        
        <View style={styles.mealContextItem}>
          <View style={styles.mealContextIconContainer}>
            <Text style={styles.mealContextIcon}>⏱️</Text>
          </View>
          <Text style={styles.mealContextName}>Fasting</Text>
          <Text style={styles.mealContextValue}>{mealContextData.fasting.avg}</Text>
          <Text style={styles.mealContextReadings}>{mealContextData.fasting.count} readings</Text>
        </View>
        
        <View style={styles.mealContextItem}>
          <View style={styles.mealContextIconContainer}>
            <Text style={styles.mealContextIcon}>🛌</Text>
          </View>
          <Text style={styles.mealContextName}>Bedtime</Text>
          <Text style={styles.mealContextValue}>{mealContextData.bedtime.avg}</Text>
          <Text style={styles.mealContextReadings}>{mealContextData.bedtime.count} readings</Text>
        </View>
      </View>

      <Text style={styles.insightText}>
        {getMealContextInsight()}
      </Text>
    </View>
  );

  // Generate insights based on the data
  const getTimeOfDayInsight = () => {
    if (stats.readingsCount < 5) {
      return "Add more readings to get insights about your glucose levels throughout the day.";
    }

    const periods = [
      { name: "morning", avg: timeOfDayData.morning.avg, count: timeOfDayData.morning.count },
      { name: "afternoon", avg: timeOfDayData.afternoon.avg, count: timeOfDayData.afternoon.count },
      { name: "evening", avg: timeOfDayData.evening.avg, count: timeOfDayData.evening.count },
      { name: "night", avg: timeOfDayData.night.avg, count: timeOfDayData.night.count }
    ].filter(period => period.count > 0);

    if (periods.length < 2) {
      return "Try to log your glucose at different times of day to get more insights.";
    }

    // Find highest and lowest periods
    periods.sort((a, b) => b.avg - a.avg);
    const highest = periods[0];
    const lowest = periods[periods.length - 1];

    if (highest.avg - lowest.avg > 30) {
      return `Your glucose tends to be highest during the ${highest.name} (${highest.avg} mg/dL) and lowest during the ${lowest.name} (${lowest.avg} mg/dL). A difference of ${highest.avg - lowest.avg} mg/dL suggests you may want to adjust your routine during the ${highest.name}.`;
    }

    return `Your glucose levels are relatively stable throughout the day, with a difference of just ${highest.avg - lowest.avg} mg/dL between your highest (${highest.name}) and lowest (${lowest.name}) periods.`;
  };

  const getMealContextInsight = () => {
    if (stats.readingsCount < 5) {
      return "Add more readings with meal context to get insights about how food affects your glucose.";
    }

    const contexts = [
      { name: "before meals", avg: mealContextData.beforeMeal.avg, count: mealContextData.beforeMeal.count },
      { name: "after meals", avg: mealContextData.afterMeal.avg, count: mealContextData.afterMeal.count },
      { name: "fasting", avg: mealContextData.fasting.avg, count: mealContextData.fasting.count },
      { name: "bedtime", avg: mealContextData.bedtime.avg, count: mealContextData.bedtime.count }
    ].filter(context => context.count > 0);

    if (contexts.length < 2) {
      return "Try to log your glucose in different meal contexts to get more insights.";
    }

    // Check before/after meal difference if both exist
    const beforeMeal = mealContextData.beforeMeal;
    const afterMeal = mealContextData.afterMeal;

    if (beforeMeal.count > 0 && afterMeal.count > 0) {
      const difference = afterMeal.avg - beforeMeal.avg;
      
      if (difference > 50) {
        return `Your glucose rises significantly after meals (${difference} mg/dL on average). Consider adjusting your meal composition to include more protein and fiber, which can help reduce post-meal spikes.`;
      } else if (difference > 30) {
        return `Your glucose rises moderately after meals (${difference} mg/dL on average), which is typical for many people with diabetes.`;
      } else {
        return `Your glucose shows minimal change after meals (${difference} mg/dL on average), which is excellent metabolic control.`;
      }
    }

    // Default insight
    contexts.sort((a, b) => b.avg - a.avg);
    const highest = contexts[0];
    const lowest = contexts[contexts.length - 1];

    return `Your ${highest.name} readings (${highest.avg} mg/dL) tend to be higher than your ${lowest.name} readings (${lowest.avg} mg/dL).`;
  };

  return (
    <Container scrollable={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Analytics</Text>

        <View style={styles.timeRangeSelector}>
          {renderTimeRangeButton('24h', '24h')}
          {renderTimeRangeButton('Week', '7d')}
          {renderTimeRangeButton('Month', '30d')}
          {renderTimeRangeButton('All', 'all')}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : readings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No Data Available</Text>
            <Text style={styles.emptySubText}>
              Start logging your glucose readings to see statistics and trends
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card variant="elevated">
              <GlucoseChart data={filteredReadings} timeRange={timeRange} />
            </Card>

            <Card variant="elevated" style={styles.statsCard}>
              <View style={styles.tabsContainer}>
                {renderTabButton('Overview', 'overview')}
                {renderTabButton('Time of Day', 'time-of-day')}
                {renderTabButton('Meal Impact', 'meal-impact')}
              </View>
              
              {selectedStatistic === 'overview' && renderOverviewTab()}
              {selectedStatistic === 'time-of-day' && renderTimeOfDayTab()}
              {selectedStatistic === 'meal-impact' && renderMealImpactTab()}
            </Card>
          </ScrollView>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    padding: 2,
    marginBottom: SIZES.md,
    alignSelf: 'center',
  },
  timeRangeButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.xs,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: COLORS.text,
  },
  timeRangeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
  },
  statsCard: {
    marginTop: SIZES.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tabContent: {
    paddingBottom: SIZES.md,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  rangeStats: {
    marginBottom: SIZES.lg,
  },
  rangeStatBar: {
    height: 20,
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SIZES.sm,
  },
  rangeStatSegment: {
    height: '100%',
  },
  rangeStatLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeStatLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  rangeText: {
    fontSize: 12,
    color: COLORS.text,
    marginRight: 4,
  },
  rangeCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  minMaxItem: {
    alignItems: 'center',
    flex: 1,
  },
  minMaxLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  minMaxValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  minMaxUnit: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.border,
  },
  timeOfDayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  timeOfDayItem: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeOfDayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  timeOfDayIcon: {
    fontSize: 20,
  },
  timeOfDayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  timeOfDayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timeOfDayReadings: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  mealContextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  mealContextItem: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealContextIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  mealContextIcon: {
    fontSize: 20,
  },
  mealContextName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  mealContextValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  mealContextReadings: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: SIZES.sm,
    borderRadius: SIZES.xs,
  },
});

export default AnalyticsScreen; 