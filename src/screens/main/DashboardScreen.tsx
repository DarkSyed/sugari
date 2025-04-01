import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Swipeable } from 'react-native-gesture-handler';
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
  deleteBloodSugarReading
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

const DashboardScreen: React.FC = () => {
  const { userSettings, theme } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [glucoseReadings, setGlucoseReadings] = useState<BloodGlucoseReading[]>([]);
  const [sugarReadings, setSugarReadings] = useState<BloodSugarReading[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [insulinDoses, setInsulinDoses] = useState<InsulinDose[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeReadingType, setActiveReadingType] = useState<'glucose' | 'sugar'>('sugar');
  const [showLatestReading, setShowLatestReading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch readings
      const sugarData = await getBloodSugarReadings();
      setSugarReadings(sugarData);
      setGlucoseReadings(sugarData); // For now, both are the same

      // Fetch food entries
      const foodData = await getFoodEntries();
      setFoodEntries(foodData);

      // Fetch insulin doses
      const insulinData = await getInsulinDoses();
      setInsulinDoses(insulinData);

      // Get AI insights
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Add useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
  };

  const getLatestGlucoseReading = (): BloodGlucoseReading | null => {
    if (glucoseReadings.length === 0) {
      return null;
    }

    return glucoseReadings.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const getLatestSugarReading = (): BloodSugarReading | null => {
    if (sugarReadings.length === 0) {
      return null;
    }

    return sugarReadings.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const latestGlucoseReading = getLatestGlucoseReading();
  const latestSugarReading = getLatestSugarReading();

  const formatTimeSince = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    }
  };

  // Get color based on blood sugar value
  const getReadingColor = (value: number) => {
    if (value < NORMAL_SUGAR_MIN) {
      return COLORS.danger; // Low
    } else if (value > NORMAL_SUGAR_MAX) {
      return COLORS.warning; // High
    } else {
      return COLORS.success; // Normal
    }
  };

  return (
    <Container scrollable>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userSettings?.firstName || 'there'}!</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate(ROUTES.PROFILE)}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {userSettings?.firstName?.[0] || userSettings?.email?.[0] || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Latest Reading */}
        {showLatestReading && latestSugarReading && (
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
                <Text style={styles.timeSinceText}>{formatTimeSince(latestSugarReading.timestamp)}</Text>
              </View>
              
              <View style={styles.readingContent}>
                <View style={styles.readingValueContainer}>
                  <Text style={[styles.readingValue, { color: getReadingColor(latestSugarReading.value) }]}>
                    {latestSugarReading.value}
                  </Text>
                  <Text style={styles.readingUnit}>mg/dL</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate(ROUTES.ADD_GLUCOSE)}
                >
                  <Text style={styles.addButtonText}>Add Reading</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.crudButtonsContainer}>
                <TouchableOpacity
                  style={styles.crudButton}
                  onPress={() => navigation.navigate(ROUTES.ADD_GLUCOSE, { 
                    readingId: latestSugarReading.id,
                    initialData: latestSugarReading
                  })}
                >
                  <Text style={styles.crudButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              {/* Insulin Button */}
              <TouchableOpacity
                style={styles.insulinButton}
                onPress={() => navigation.navigate(ROUTES.ADD_INSULIN)}
              >
                <Text style={styles.insulinButtonText}>Log Insulin</Text>
              </TouchableOpacity>
            </Card>
          </Swipeable>
        )}

        {!showLatestReading && latestSugarReading && (
          <TouchableOpacity 
            style={styles.showLatestButton}
            onPress={() => setShowLatestReading(true)}
          >
            <Text style={styles.showLatestButtonText}>Show Latest Reading</Text>
          </TouchableOpacity>
        )}

        {!latestSugarReading && (
          <Card variant="elevated">
            <View style={styles.noReadingContainer}>
              <Text style={styles.noReadingText}>No readings yet</Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => navigation.navigate(ROUTES.ADD_GLUCOSE)}
              >
                <Text style={styles.addFirstButtonText}>Add First Reading</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Glucose Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>{activeReadingType === 'glucose' ? 'Glucose' : 'Sugar'} Trends</Text>
            <View style={styles.timeRangeSelector}>
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  timeRange === '24h' && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange('24h')}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === '24h' && styles.timeRangeTextActive,
                  ]}
                >
                  24h
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  timeRange === '7d' && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange('7d')}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === '7d' && styles.timeRangeTextActive,
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeRangeButton,
                  timeRange === '30d' && styles.timeRangeButtonActive,
                ]}
                onPress={() => setTimeRange('30d')}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === '30d' && styles.timeRangeTextActive,
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <GlucoseChart 
            data={activeReadingType === 'glucose' ? glucoseReadings : sugarReadings} 
            timeRange={timeRange} 
          />
        </View>

        {/* AI Insights */}
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

        {/* Quick Actions */}
        <Card variant="elevated">
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Home', { screen: ROUTES.ADD_GLUCOSE })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4B89DC' }]}>
                <Text style={styles.quickActionIconText}>📊</Text>
              </View>
              <Text style={styles.quickActionText}>Log Glucose</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Home', { screen: ROUTES.ADD_FOOD })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#2ECC71' }]}>
                <Text style={styles.quickActionIconText}>🍽️</Text>
              </View>
              <Text style={styles.quickActionText}>Log Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Home', { screen: ROUTES.ADD_INSULIN })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F39C12' }]}>
                <Text style={styles.quickActionIconText}>💉</Text>
              </View>
              <Text style={styles.quickActionText}>Log Insulin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate(ROUTES.ANALYTICS)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#9B59B6' }]}>
                <Text style={styles.quickActionIconText}>📈</Text>
              </View>
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Home', { screen: ROUTES.ADD_A1C })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E74C3C' }]}>
                <Text style={styles.quickActionIconText}>🔬</Text>
              </View>
              <Text style={styles.quickActionText}>A1C</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Home', { screen: ROUTES.ADD_WEIGHT })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#3498DB' }]}>
                <Text style={styles.quickActionIconText}>⚖️</Text>
              </View>
              <Text style={styles.quickActionText}>Weight</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Home', { screen: ROUTES.BP_LOG })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#16A085' }]}>
                <Text style={styles.quickActionIconText}>❤️</Text>
              </View>
              <Text style={styles.quickActionText}>BP</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Readings */}
        <View style={styles.recentReadingsContainer}>
          <View style={styles.recentReadingsHeader}>
            <Text style={styles.sectionTitle}>Recent Blood Glucose Readings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: ROUTES.GLUCOSE_LOG })}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeReadingType === 'glucose' ? (
            glucoseReadings.length > 0 ? (
              glucoseReadings
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 3)
                .map((reading) => (
                  <GlucoseCard
                    key={reading.id}
                    reading={reading}
                    onPress={() => {
                      // Navigate to reading details
                    }}
                  />
                ))
            ) : (
              <Text style={styles.noReadingsText}>No glucose readings to display</Text>
            )
          ) : (
            sugarReadings.length > 0 ? (
              sugarReadings
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 3)
                .map((reading) => (
                  <GlucoseCard
                    key={reading.id}
                    reading={reading}
                    onPress={() => {
                      // Navigate to reading details
                    }}
                  />
                ))
            ) : (
              <Text style={styles.noReadingsText}>No blood glucose readings to display</Text>
            )
          )}
        </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  latestReadingContainer: {
    width: '100%',
  },
  latestReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  latestReadingSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  readingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  readingTypeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    padding: 2,
  },
  readingTypeButton: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.xs,
  },
  readingTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  readingTypeText: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  readingTypeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.lightText,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    alignItems: 'center',
    width: '22%',
    marginBottom: SIZES.md,
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
    color: COLORS.text,
    textAlign: 'center',
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
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  recentReadingsCard: {
    marginTop: SIZES.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  recentReadingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  recentReadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentReadingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  recentReadingTime: {
    fontSize: 12,
    color: COLORS.lightText,
    marginLeft: SIZES.sm,
  },
  recentReadingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentReadingButton: {
    padding: SIZES.sm,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.xs,
  },
  recentReadingButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  recentReadingContext: {
    fontSize: 12,
    color: COLORS.lightText,
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