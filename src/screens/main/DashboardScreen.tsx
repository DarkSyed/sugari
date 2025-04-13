import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, ROUTES, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import { BloodSugarReading, FoodEntry, InsulinDose } from '../../types';
import { 
  getBloodSugarReadings, 
  getFoodEntries, 
  getInsulinDoses, 
  getA1CReadings,
  getWeightMeasurements,
  getBloodPressureReadings,
  deleteBloodSugarReading,
  getRecentBloodSugarReadings
} from '../../services/databaseFix';
import { getAIPoweredInsights } from '../../services/aiService';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GlucoseChart from '../../components/GlucoseChart';
import GlucoseCard from '../../components/GlucoseCard';
import SugarCard from '../../components/SugarCard';

// Define BloodGlucoseReading as an alias to BloodSugarReading since they have the same structure
type BloodGlucoseReading = BloodSugarReading;

// Type definitions
type ReadingType = 'glucose' | 'sugar';
type TimeRangeType = '24h' | '7d' | '30d' | 'all';
type QuickActionItem = {
  icon: string;
  text: string;
  color: string;
  route: string;
  screen?: string;
};

const DashboardScreen: React.FC = () => {
  const { userSettings, theme } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [insulinDoses, setInsulinDoses] = useState<InsulinDose[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readingType, setReadingType] = useState<ReadingType>('sugar');
  const [showLatestReading, setShowLatestReading] = useState(true);

  // Quick actions configuration
  const quickActions: QuickActionItem[] = [
    { icon: '📊', text: 'Log Glucose', color: '#4B89DC', route: 'Home', screen: ROUTES.ADD_GLUCOSE },
    { icon: '🍽️', text: 'Log Food', color: '#2ECC71', route: 'Home', screen: ROUTES.ADD_FOOD },
    { icon: '💉', text: 'Log Insulin', color: '#F39C12', route: 'Home', screen: ROUTES.ADD_INSULIN },
    { icon: '🔬', text: 'A1C', color: '#E74C3C', route: 'Home', screen: ROUTES.ADD_A1C },
    { icon: '⚖️', text: 'Weight', color: '#3498DB', route: 'Home', screen: ROUTES.ADD_WEIGHT },
    { icon: '❤️', text: 'BP', color: '#16A085', route: 'Home', screen: ROUTES.BP_LOG }
  ];

  // Data fetching
  const fetchUserData = useCallback(async () => {
    // Don't show main loader if just refreshing
    if (!refreshing) {
      setLoading(true);
    }
    try {
      // Parallel data fetching
      const [sugarData, foodData, insulinData] = await Promise.all([
        getBloodSugarReadings(),
        getFoodEntries(),
        getInsulinDoses()
      ]);
      
      setReadings(sugarData);
      setFoodEntries(foodData);
      setInsulinDoses(insulinData);

      // Get AI insights if we have readings
      if (sugarData.length > 0) {
        const aiInsights = await getAIPoweredInsights(
          [], // glucoseReadings
          sugarData,
          foodData,
          insulinData
        );
        setInsights(aiInsights);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false); // Ensure refreshing is set to false
    }
  }, [refreshing]);

  // Initial load and refresh handling
  useEffect(() => { fetchUserData(); }, [fetchUserData]);
  useFocusEffect(useCallback(() => { fetchUserData(); }, [fetchUserData]));
  const onRefresh = useCallback(async () => {
    setRefreshing(true); // Start refreshing indicator
    await fetchUserData(); // Fetch data (will set refreshing to false)
  }, [fetchUserData]);

  // Helper functions
  const getLatestReading = (): BloodSugarReading | null => {
    if (!readings.length) return null;
    return [...readings].sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  const formatTimeSince = (timestamp: number): string => {
    const diffInHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(diffInHours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  const getReadingColor = (value: number) => {
    if (value < NORMAL_SUGAR_MIN) return COLORS.danger;
    if (value > NORMAL_SUGAR_MAX) return COLORS.warning;
    return COLORS.success;
  };

  const navigateTo = (route: string, screen?: string, params?: any) => {
    if (screen) {
      navigation.navigate(route, { screen, ...params });
    } else {
      navigation.navigate(route, params);
    }
  };
  
  // Get the greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get personalized greeting
  const getPersonalizedGreeting = () => {
    const greeting = getGreeting();
    const name = userSettings?.firstName || 'there';
    return `${greeting}, ${name}!`;
  };

  const handleEditLatestReading = () => {
    if (readings && readings.length > 0) {
      const latestReading = readings[0]; // Assuming readings are already sorted by date (newest first)
      navigation.navigate('AddGlucose', { 
        initialData: latestReading,
        isEditing: true // This flag tells the AddGlucoseScreen we're editing, not adding
      });
    } else {
      Alert.alert('No Reading', 'There is no reading to edit.');
    }
  };

  // UI Components
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{getPersonalizedGreeting()}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate(ROUTES.PROFILE)}
      >
        <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderLatestReading = () => {
    const latestReading = getLatestReading();
    
    if (!latestReading) {
      return (
        <Card variant="elevated">
          <View style={styles.noReadingContainer}>
            <Text style={styles.noReadingText}>No readings yet</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigateTo('Home', ROUTES.ADD_GLUCOSE)}
            >
              <Text style={styles.addFirstButtonText}>Add First Reading</Text>
            </TouchableOpacity>
          </View>
        </Card>
      );
    }

    if (!showLatestReading) {
      return (
        <TouchableOpacity 
          style={styles.showLatestButton}
          onPress={() => setShowLatestReading(true)}
        >
          <Text style={styles.showLatestButtonText}>Show Latest Reading</Text>
        </TouchableOpacity>
      );
    }

    return (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={() => setShowLatestReading(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      >
        <Card variant="elevated">
          <View style={styles.latestReadingHeader}>
            <Text style={styles.sectionTitle}>Latest Reading</Text>
            <Text style={styles.timeSinceText}>{formatTimeSince(latestReading.timestamp)}</Text>
          </View>
          
          <View style={styles.readingContent}>
            <View style={styles.readingValueContainer}>
              <Text style={[styles.readingValue, { color: getReadingColor(latestReading.value) }]}>
                {latestReading.value}
              </Text>
              <Text style={styles.readingUnit}>mg/dL</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigateTo('Home', ROUTES.ADD_GLUCOSE)}
            >
              <Text style={styles.addButtonText}>Add Reading</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.crudButtonsContainer}>
            <TouchableOpacity
              style={styles.crudButton}
              onPress={handleEditLatestReading}
            >
              <Text style={styles.crudButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.insulinButton}
            onPress={() => navigateTo('Home', ROUTES.ADD_INSULIN)}
          >
            <Text style={styles.insulinButtonText}>Log Insulin</Text>
          </TouchableOpacity>
        </Card>
      </Swipeable>
    );
  };

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.sectionTitle}>{readingType === 'glucose' ? 'Glucose' : 'Sugar'} Trends</Text>
        <View style={styles.timeRangeSelector}>
          {['24h', '7d', '30d'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(range as TimeRangeType)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range === '7d' ? 'Week' : range === '30d' ? 'Month' : range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <GlucoseChart data={readings} timeRange={timeRange} />
    </View>
  );

  const renderInsights = () => (
    <Card variant="elevated">
      <Text style={styles.sectionTitle}>Insights</Text>
      {insights.length > 0 ? (
        <View style={styles.insightsContainer}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={styles.insightBullet} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noInsightsText}>
          Add more readings to get personalized insights
        </Text>
      )}
    </Card>
  );

  const renderQuickActions = () => (
    <Card variant="elevated">
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsRow}>
          {quickActions.slice(0, 3).map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => navigateTo(action.route, action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Text style={styles.quickActionIconText}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.quickActionsRow}>
          {quickActions.slice(3).map((action, index) => (
            <TouchableOpacity
              key={index + 3}
              style={styles.quickActionButton}
              onPress={() => navigateTo(action.route, action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Text style={styles.quickActionIconText}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Card>
  );

  const renderRecentReadings = () => {
    const sortedReadings = [...readings]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
      
    return (
      <View style={styles.recentReadingsContainer}>
        <View style={styles.recentReadingsHeader}>
          <Text style={styles.sectionTitle}>Recent Blood Glucose Readings</Text>
          <TouchableOpacity onPress={() => navigateTo('Home', ROUTES.GLUCOSE_LOG)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {sortedReadings.length > 0 ? (
          sortedReadings.map((reading) => (
            <GlucoseCard
              key={reading.id}
              reading={reading}
              onPress={() => {/* Navigate to reading details */}}
            />
          ))
        ) : (
          <Text style={styles.noReadingsText}>No readings to display</Text>
        )}
      </View>
    );
  };

  return (
    <Container scrollable>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]} 
            tintColor={COLORS.primary}
          />
        }
      >
        {renderHeader()}
        {renderLatestReading()}
        {renderChart()}
        {renderInsights()}
        {renderQuickActions()}
        {renderRecentReadings()}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  date: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  latestReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  readingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  readingValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  readingUnit: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: 8,
    marginLeft: 4,
  },
  noReadingContainer: {
    alignItems: 'center',
    padding: SIZES.md,
  },
  noReadingText: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.md,
  },
  addFirstButton: {
    marginTop: SIZES.sm,
  },
  addFirstButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  addButton: {
    padding: SIZES.sm,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.xs,
  },
  addButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  chartContainer: {
    marginVertical: SIZES.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.xs,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeText: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  timeRangeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  insightsContainer: {
    marginTop: SIZES.xs,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
    alignItems: 'flex-start',
  },
  insightBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: SIZES.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  noInsightsText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    padding: SIZES.md,
  },
  quickActionsContainer: {
    flexDirection: 'column',
    marginTop: SIZES.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  quickActionButton: {
    width: '32%',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.text,
  },
  recentReadingsContainer: {
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  recentReadingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  noReadingsText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    padding: SIZES.lg,
  },
  insulinButton: {
    backgroundColor: COLORS.secondary + '20',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.sm,
    alignSelf: 'center',
    marginTop: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  insulinButtonText: {
    color: COLORS.secondary,
    fontWeight: '500',
    fontSize: 14,
  },
  crudButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crudButton: {
    padding: SIZES.sm,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.xs,
  },
  crudButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  timeSinceText: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  dismissButton: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 110,
    height: '90%',
    borderRadius: 20,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dismissButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  showLatestButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.sm,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  showLatestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DashboardScreen; 