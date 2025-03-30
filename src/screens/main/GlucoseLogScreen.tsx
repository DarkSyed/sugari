import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import {
  getBloodSugarReadings,
  getBloodSugarStats,
  deleteBloodSugarReading
} from '../../services/database';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { BloodSugarReading } from '../../types';

const GlucoseLogScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { settings } = useApp();
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [stats, setStats] = useState({
    avgReading: 0,
    maxReading: 0,
    minReading: 0,
    inRangePercentage: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sugar' | 'glucose'>('sugar');

  const fetchReadings = useCallback(async () => {
    try {
      const data = await getBloodSugarReadings(activeTab);
      setReadings(data);
      
      const statsData = await getBloodSugarStats(activeTab);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchReadings();
    }, [fetchReadings])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReadings();
  }, [fetchReadings]);

  const handleAddReading = () => {
    if (activeTab === 'sugar') {
      navigation.navigate('AddSugar');
    } else {
      navigation.navigate('AddGlucose');
    }
  };

  const handleEditReading = (reading: BloodSugarReading) => {
    if (activeTab === 'sugar') {
      navigation.navigate('AddSugar', { readingId: reading.id, initialData: reading });
    } else {
      navigation.navigate('AddGlucose', { readingId: reading.id, initialData: reading });
    }
  };

  const handleDeleteReading = (id: number) => {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this reading?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBloodSugarReading(id, activeTab);
              fetchReadings();
            } catch (error) {
              console.error('Error deleting reading:', error);
              Alert.alert('Error', 'Failed to delete reading.');
            }
          }
        }
      ]
    );
  };

  const getReadingColor = (value: number) => {
    const unit = settings?.units || 'mg/dL';
    
    // Values for mg/dL
    let low = 70;
    let high = 180;
    
    // Convert thresholds if using mmol/L
    if (unit === 'mmol/L') {
      low = 3.9;
      high = 10.0;
    }
    
    if (value < low) {
      return COLORS.danger;
    } else if (value > high) {
      return COLORS.warning;
    }
    return COLORS.success;
  };

  const convertReadingValue = (value: number) => {
    const unit = settings?.units || 'mg/dL';
    
    if (unit === 'mmol/L' && activeTab === 'sugar') {
      // Convert from mg/dL to mmol/L (divide by 18)
      return (value / 18).toFixed(1);
    }
    return value.toString();
  };

  const renderReadingItem = ({ item }: { item: BloodSugarReading }) => {
    const readingValue = Number(item.value);
    const context = item.context || 'Not specified';
    
    return (
      <Card variant="flat" style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <View style={styles.readingDateContainer}>
            <Text style={styles.readingDate}>{formatDate(new Date(item.timestamp))}</Text>
            <Text style={styles.readingTime}>{formatTime(new Date(item.timestamp))}</Text>
          </View>
          <View style={styles.readingActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditReading(item)}
            >
              <Ionicons name="pencil" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteReading(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.readingContent}>
          <View style={styles.readingValueContainer}>
            <Text style={[styles.readingValue, { color: getReadingColor(readingValue) }]}>
              {convertReadingValue(readingValue)}
            </Text>
            <Text style={styles.readingUnit}>{settings?.units || 'mg/dL'}</Text>
          </View>
          
          <View style={styles.readingContextContainer}>
            <Text style={styles.readingContextLabel}>Context:</Text>
            <Text style={styles.readingContext}>{context}</Text>
          </View>
          
          {item.notes && (
            <View style={styles.readingNotesContainer}>
              <Text style={styles.readingNotesLabel}>Notes:</Text>
              <Text style={styles.readingNotes}>{item.notes}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderTabButton = (tab: 'sugar' | 'glucose', label: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.activeTabButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStats = () => (
    <Card variant="elevated" style={styles.statsCard}>
      <Text style={styles.statsTitle}>Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.avgReading ? 
              convertReadingValue(Math.round(stats.avgReading)) : 
              '—'
            }
          </Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.maxReading ? 
              convertReadingValue(stats.maxReading) : 
              '—'
            }
          </Text>
          <Text style={styles.statLabel}>Highest</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.minReading ? 
              convertReadingValue(stats.minReading) : 
              '—'
            }
          </Text>
          <Text style={styles.statLabel}>Lowest</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.totalCount ? `${Math.round(stats.inRangePercentage)}%` : '—'}
          </Text>
          <Text style={styles.statLabel}>In Range</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <Container>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Blood Sugar Log</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddReading}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        {renderTabButton('sugar', 'Blood Sugar')}
        {renderTabButton('glucose', 'Glucose')}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {renderStats()}
          
          {readings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={64} color={COLORS.lightText} />
              <Text style={styles.emptyText}>No readings yet</Text>
              <Text style={styles.emptySubText}>
                Start tracking your {activeTab === 'sugar' ? 'blood sugar' : 'glucose'} levels by adding your first reading
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={handleAddReading}
              >
                <Text style={styles.emptyAddButtonText}>
                  Add {activeTab === 'sugar' ? 'Blood Sugar' : 'Glucose'} Reading
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={readings}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderReadingItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                />
              }
            />
          )}
        </>
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
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.inputBackground,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  activeTabButtonText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginBottom: SIZES.md,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: SIZES.sm,
    paddingRight: SIZES.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  list: {
    paddingBottom: SIZES.xl,
  },
  readingCard: {
    marginBottom: SIZES.md,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  readingDateContainer: {
    flexDirection: 'column',
  },
  readingDate: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  readingTime: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  readingActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SIZES.xs,
    marginLeft: SIZES.xs,
  },
  readingContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  readingValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: SIZES.md,
  },
  readingValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  readingUnit: {
    fontSize: 14,
    color: COLORS.lightText,
    marginLeft: 4,
  },
  readingContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  readingContextLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginRight: 4,
  },
  readingContext: {
    fontSize: 14,
    color: COLORS.text,
  },
  readingNotesContainer: {
    width: '100%',
    marginTop: SIZES.xs,
  },
  readingNotesLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 2,
  },
  readingNotes: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: 'center',
    marginTop: SIZES.xs,
    marginBottom: SIZES.md,
  },
  emptyAddButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.sm,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default GlucoseLogScreen; 