import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { getBloodPressureReadings } from '../../services/databaseFix';
import { BloodPressureReading } from '../../types';
import Container from '../../components/Container';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';

const BloodPressureLogScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodPressureReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const [stats, setStats] = useState({
    avgSystolic: 0,
    avgDiastolic: 0,
    totalReadings: 0,
  });

  useEffect(() => {
    loadBloodPressureReadings();
  }, []);

  useEffect(() => {
    filterReadings(timeFilter);
    calculateStats(timeFilter);
  }, [readings, timeFilter]);

  const loadBloodPressureReadings = async () => {
    try {
      setLoading(true);
      const data = await getBloodPressureReadings();
      setReadings(data);
      setFilteredReadings(data);
    } catch (error) {
      console.error('Error loading blood pressure readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReadings = (filter: 'all' | 'week' | 'month') => {
    const now = new Date().getTime();
    let filtered = readings;

    if (filter === 'week') {
      // Filter for last 7 days
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      filtered = readings.filter(reading => reading.timestamp >= oneWeekAgo);
    } else if (filter === 'month') {
      // Filter for last 30 days
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
      filtered = readings.filter(reading => reading.timestamp >= oneMonthAgo);
    }

    setFilteredReadings(filtered);
  };

  const calculateStats = (filter: 'all' | 'week' | 'month') => {
    const now = new Date().getTime();
    let filtered = readings;

    if (filter === 'week') {
      // Filter for last 7 days
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      filtered = readings.filter(reading => reading.timestamp >= oneWeekAgo);
    } else if (filter === 'month') {
      // Filter for last 30 days
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
      filtered = readings.filter(reading => reading.timestamp >= oneMonthAgo);
    }

    if (filtered.length === 0) {
      setStats({
        avgSystolic: 0,
        avgDiastolic: 0,
        totalReadings: 0,
      });
      return;
    }

    const totalSystolic = filtered.reduce((sum, reading) => sum + reading.systolic, 0);
    const totalDiastolic = filtered.reduce((sum, reading) => sum + reading.diastolic, 0);

    setStats({
      avgSystolic: Math.round(totalSystolic / filtered.length),
      avgDiastolic: Math.round(totalDiastolic / filtered.length),
      totalReadings: filtered.length,
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getBloodPressureCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { text: 'Normal', color: COLORS.success };
    } else if ((systolic >= 120 && systolic <= 129) && diastolic < 80) {
      return { text: 'Elevated', color: '#FFD700' }; // Gold
    } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      return { text: 'Stage 1 HTN', color: '#FFA500' }; // Orange
    } else if (systolic >= 140 || diastolic >= 90) {
      return { text: 'Stage 2 HTN', color: COLORS.error };
    } else if (systolic > 180 || diastolic > 120) {
      return { text: 'Crisis', color: '#8B0000' }; // Dark red
    }
    return { text: 'Unknown', color: COLORS.lightText };
  };

  const renderItem = ({ item }: { item: BloodPressureReading }) => {
    const category = getBloodPressureCategory(item.systolic, item.diastolic);
    
    return (
      <Card style={styles.readingCard}>
        <View style={styles.readingCardHeader}>
          <View>
            <Text style={styles.bpValueText}>{item.systolic}/{item.diastolic} mmHg</Text>
            <Text style={[styles.categoryText, { color: category.color }]}>{category.text}</Text>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Pressure</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Home', { screen: ROUTES.ADD_BP })}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={30} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'all' && styles.activeFilterButton]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[styles.filterText, timeFilter === 'all' && styles.activeFilterText]}>All Time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'week' && styles.activeFilterButton]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={[styles.filterText, timeFilter === 'week' && styles.activeFilterText]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'month' && styles.activeFilterButton]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={[styles.filterText, timeFilter === 'month' && styles.activeFilterText]}>This Month</Text>
        </TouchableOpacity>
      </View>

      <Card variant="elevated" style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgSystolic}</Text>
            <Text style={styles.statLabel}>Avg. Systolic</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgDiastolic}</Text>
            <Text style={styles.statLabel}>Avg. Diastolic</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReadings}</Text>
            <Text style={styles.statLabel}>Total Readings</Text>
          </View>
        </View>
      </Card>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>
          {filteredReadings.length > 0 ? (
            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredReadings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No blood pressure readings found</Text>
              <TouchableOpacity
                style={styles.addReadingButton}
                onPress={() => navigation.navigate(ROUTES.ADD_BP)}
              >
                <Text style={styles.addReadingButtonText}>Add a Blood Pressure Reading</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: SIZES.xs,
    paddingRight: SIZES.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    padding: SIZES.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.xs,
    marginHorizontal: 2,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  statsCard: {
    marginBottom: SIZES.md,
    padding: SIZES.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  addReadingButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.xs,
  },
  addReadingButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  readingCard: {
    marginBottom: SIZES.sm,
    padding: SIZES.md,
  },
  readingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bpValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  categoryText: {
    fontSize: 14,
    marginTop: 2,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  notesContainer: {
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
  },
});

export default BloodPressureLogScreen; 