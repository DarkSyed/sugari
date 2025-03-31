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
import { COLORS, SIZES, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import { BloodSugarReading } from '../../types';
import { getBloodSugarReadings } from '../../services/databaseFix';
import Container from '../../components/Container';
import Card from '../../components/Card';
import GlucoseChart from '../../components/GlucoseChart';

const AnalyticsScreen: React.FC = () => {
  const { theme } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodSugarReading[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedStatistic, setSelectedStatistic] = useState<'overview' | 'time-of-day' | 'meal-impact'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getBloodSugarReadings();
      setReadings(data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Filter readings based on time range
  useEffect(() => {
    const getFilteredReadings = () => {
      // If no readings, return empty array
      if (!readings.length) return [];
      
      const now = new Date().getTime();
      let filtered;
      
      switch (timeRange) {
        case '24h':
          filtered = readings.filter(r => (now - r.timestamp) <= 24 * 60 * 60 * 1000);
          break;
        case '7d':
          filtered = readings.filter(r => (now - r.timestamp) <= 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          filtered = readings.filter(r => (now - r.timestamp) <= 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          filtered = [...readings];
          break;
      }
      
      return filtered;
    };
    
    setFilteredReadings(getFilteredReadings());
  }, [readings, timeRange]);

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
    
    const inRangeCount = values.filter(v => v >= NORMAL_SUGAR_MIN && v <= NORMAL_SUGAR_MAX).length;
    const belowCount = values.filter(v => v < NORMAL_SUGAR_MIN).length;
    const aboveCount = values.filter(v => v > NORMAL_SUGAR_MAX).length;
    
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
      const date = new Date(r.timestamp);
      const hour = date.getHours();
      return hour >= 6 && hour < 12;
    });
    
    const afternoon = filteredReadings.filter(r => {
      const date = new Date(r.timestamp);
      const hour = date.getHours();
      return hour >= 12 && hour < 18;
    });
    
    const evening = filteredReadings.filter(r => {
      const date = new Date(r.timestamp);
      const hour = date.getHours();
      return hour >= 18 && hour < 22;
    });
    
    const night = filteredReadings.filter(r => {
      const date = new Date(r.timestamp);
      const hour = date.getHours();
      return hour >= 22 || hour < 6;
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
    const beforeMeal = filteredReadings.filter(r => r.context === 'before_meal');
    const afterMeal = filteredReadings.filter(r => r.context === 'after_meal');
    const fasting = filteredReadings.filter(r => r.context === 'fasting');
    const bedtime = filteredReadings.filter(r => r.context === 'bedtime');
    const other = filteredReadings.filter(r => r.context === 'other' || !r.context);

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

      <Text style={styles.sectionSubtitle}>Glucose Range</Text>
      
      <View style={styles.minMaxContainer}>
        <View style={styles.minMaxItem}>
          <Text style={styles.minMaxLabel}>Min</Text>
          <Text style={styles.minMaxValue}>{stats.min}</Text>
          <Text style={styles.minMaxUnit}>mg/dL</Text>
        </View>
        
        <View style={styles.verticalDivider} />
        
        <View style={styles.minMaxItem}>
          <Text style={styles.minMaxLabel}>Max</Text>
          <Text style={styles.minMaxValue}>{stats.max}</Text>
          <Text style={styles.minMaxUnit}>mg/dL</Text>
        </View>
      </View>
    </View>
  );

  const renderTimeOfDayTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionSubtitle}>Time of Day Analysis</Text>
      
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
      <Text style={styles.sectionSubtitle}>Meal Impact Analysis</Text>
      
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
            <Text style={styles.mealContextIcon}>🍲</Text>
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
            <Text style={styles.mealContextIcon}>🛏️</Text>
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

  const getTimeOfDayInsight = () => {
    // No readings or not enough data
    if (filteredReadings.length < 3) {
      return "Add more readings at different times of day to get personalized insights.";
    }
    
    const highestAvg = Math.max(
      timeOfDayData.morning.avg,
      timeOfDayData.afternoon.avg,
      timeOfDayData.evening.avg,
      timeOfDayData.night.avg
    );
    
    const lowestAvg = Math.min(
      ...[
        timeOfDayData.morning.avg, 
        timeOfDayData.afternoon.avg,
        timeOfDayData.evening.avg,
        timeOfDayData.night.avg
      ].filter(avg => avg > 0)
    );
    
    let highTime = "";
    let lowTime = "";
    
    if (timeOfDayData.morning.avg === highestAvg) highTime = "mornings";
    else if (timeOfDayData.afternoon.avg === highestAvg) highTime = "afternoons";
    else if (timeOfDayData.evening.avg === highestAvg) highTime = "evenings";
    else if (timeOfDayData.night.avg === highestAvg) highTime = "nights";
    
    if (timeOfDayData.morning.avg === lowestAvg) lowTime = "mornings";
    else if (timeOfDayData.afternoon.avg === lowestAvg) lowTime = "afternoons";
    else if (timeOfDayData.evening.avg === lowestAvg) lowTime = "evenings";
    else if (timeOfDayData.night.avg === lowestAvg) lowTime = "nights";
    
    return `Your glucose tends to be highest during ${highTime} (${highestAvg} mg/dL) and lowest during ${lowTime} (${lowestAvg} mg/dL). Consider adjusting your medication or meal timing to improve control during ${highTime}.`;
  };

  const getMealContextInsight = () => {
    // No readings or not enough data
    if (filteredReadings.length < 3) {
      return "Add more readings with meal context to get personalized insights.";
    }
    
    if (mealContextData.afterMeal.count > 0 && mealContextData.beforeMeal.count > 0) {
      const mealImpact = mealContextData.afterMeal.avg - mealContextData.beforeMeal.avg;
      
      if (mealImpact > 50) {
        return `Your blood sugar increases by approximately ${mealImpact} mg/dL after meals. Consider discussing carb counting strategies with your healthcare provider to better manage post-meal spikes.`;
      } else if (mealImpact > 30) {
        return `Your blood sugar increases by approximately ${mealImpact} mg/dL after meals, which is within typical ranges. Continue your current meal management approach.`;
      } else {
        return `Your blood sugar shows minimal increase (${mealImpact} mg/dL) after meals, indicating good meal management.`;
      }
    }
    
    return "Add more before and after meal readings to get insights on how food affects your glucose levels.";
  };

  if (isLoading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.lightText }}>Loading data...</Text>
        </View>
      </Container>
    );
  }

  // Quick stats for the top of the page
  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <Card variant="elevated" style={styles.quickStatsCard}>
        <Text style={styles.statsCardTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.average}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.max}</Text>
            <Text style={styles.statLabel}>Highest</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.min}</Text>
            <Text style={styles.statLabel}>Lowest</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.timeInRange}%</Text>
            <Text style={styles.statLabel}>In Range</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <Container>
      <Text style={styles.title}>Analytics</Text>

      {/* Quick stats at the top */}
      {renderQuickStats()}
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {renderTimeRangeButton('24h', '24h')}
        {renderTimeRangeButton('Week', '7d')}
        {renderTimeRangeButton('Month', '30d')}
        {renderTimeRangeButton('All', 'all')}
      </View>
      
      {filteredReadings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Data Available</Text>
          <Text style={styles.emptySubText}>
            Add blood sugar readings to see your analytics here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Glucose Chart */}
          <Card variant="elevated" style={styles.chartCard}>
            <Text style={styles.chartTitle}>Blood Glucose Trends</Text>
            <GlucoseChart data={filteredReadings} timeRange={timeRange} />
          </Card>
          
          {/* Tabs for different statistics */}
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
  quickStatsContainer: {
    marginBottom: SIZES.md,
  },
  quickStatsCard: {
    padding: SIZES.md,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: SIZES.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.lightText,
  },
  chartCard: {
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
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
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
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
    marginBottom: SIZES.xs,
  },
  timeOfDayIcon: {
    fontSize: 24,
  },
  timeOfDayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  timeOfDayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  timeOfDayReadings: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  mealContextContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
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
    marginBottom: SIZES.xs,
  },
  mealContextIcon: {
    fontSize: 24,
  },
  mealContextName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  mealContextValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
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
});

export default AnalyticsScreen; 