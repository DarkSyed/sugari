import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import Container from '../../components/Container';
import Card from '../../components/Card';
import {
  getBloodSugarReadings,
  deleteBloodSugarReading
} from '../../services/databaseFix';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { BloodSugarReading } from '../../types';

const GlucoseLogScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
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
  const [showQuickActions, setShowQuickActions] = useState(false);

  const fetchReadings = useCallback(async () => {
    try {
      const data = await getBloodSugarReadings();
      setReadings(data);
      
      // Calculate simple statistics locally since getBloodSugarStats is not available
      if (data.length > 0) {
        const values = data.map(r => r.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        // Calculate percentage in range (70-180 mg/dL)
        const inRange = values.filter(v => v >= 70 && v <= 180).length;
        const percentage = (inRange / values.length) * 100;
        
        setStats({
          avgReading: avg,
          maxReading: max,
          minReading: min,
          inRangePercentage: percentage,
          totalCount: data.length
        });
      }
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
    setShowQuickActions(true);
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
              await deleteBloodSugarReading(id);
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
    // Values for mg/dL
    let low = 70;
    let high = 180;
    
    if (value < low) {
      return COLORS.danger;
    } else if (value > high) {
      return COLORS.warning;
    }
    return COLORS.success;
  };

  const convertReadingValue = (value: number) => {
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
            <Text style={styles.readingUnit}>mg/dL</Text>
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

  const renderQuickActionsModal = () => {
    return (
      <Modal
        visible={showQuickActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuickActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Entry</Text>
              <TouchableOpacity onPress={() => setShowQuickActions(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quickActionsList}>
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  navigation.navigate('Home', { screen: 'AddGlucose' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="water-outline" size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>Blood Glucose</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  navigation.navigate('Home', { screen: 'AddInsulin' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#F39C12' }]}>
                  <Ionicons name="medical-outline" size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>Insulin</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  navigation.navigate('Home', { screen: 'AddFood' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#2ECC71' }]}>
                  <Ionicons name="restaurant-outline" size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>Food</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  navigation.navigate('Home', { screen: 'AddA1C' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#9B59B6' }]}>
                  <Ionicons name="pulse-outline" size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>A1C</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  navigation.navigate('Home', { screen: 'AddWeight' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#3498DB' }]}>
                  <Ionicons name="fitness-outline" size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>Weight</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => {
                  setShowQuickActions(false);
                  navigation.navigate('Home', { screen: 'AddBloodPressure' });
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E74C3C' }]}>
                  <Ionicons name="heart-outline" size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>Blood Pressure</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Container>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Sugar</Text>
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
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={handleAddReading}
              >
                <Text style={styles.emptyAddButtonText}>
                  Add Reading
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
      {renderQuickActionsModal()}
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
    overflow: 'hidden'
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  quickActionsList: {
    marginBottom: SIZES.md,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
});

export default GlucoseLogScreen; 