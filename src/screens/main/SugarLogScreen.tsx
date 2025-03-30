import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  TextInput,
  ScrollView,
  Modal,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { BloodSugarReading, FoodEntry, InsulinDose } from '../../types';
import { 
  getBloodSugarReadings, 
  getFoodEntries, 
  getInsulinDoses,
  deleteBloodSugarReading,
  getA1CReadings,
  getWeightMeasurements,
  getBloodPressureReadings
} from '../../services/databaseFix';
import { formatDate, formatTime, getStartOfDay, dateToTimestamp } from '../../utils/dateUtils';
import { useApp } from '../../contexts/AppContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';

// Health log entry types
type LogEntryType = 'blood_sugar' | 'insulin' | 'food' | 'a1c' | 'weight' | 'bp' | 'all';
type TimeRange = '3d' | '7d' | '14d' | '30d' | '90d';

// Combined log entry type for the unified log
interface HealthLogEntry {
  id: number;
  type: 'blood_sugar' | 'insulin' | 'food' | 'a1c' | 'weight' | 'bp';
  timestamp: number;
  primaryValue: number | string;
  secondaryValue?: number | string | null;
  context?: string | null;
  notes?: string | null;
  color: string;
  icon: string;
}

interface StatsData {
  avg: number | null;
  priorAvg: number | null;
  low: number | null;
  high: number | null;
}

const SugarLogScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { userSettings, theme } = useApp();
  const [allEntries, setAllEntries] = useState<HealthLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<HealthLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<LogEntryType>('all');
  const [searchText, setSearchText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('14d');
  const [stats, setStats] = useState<StatsData>({
    avg: null,
    priorAvg: null,
    low: null,
    high: null
  });

  // Fetch all health data
  const fetchHealthData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch blood sugar readings
      const sugarData = await getBloodSugarReadings();
      const sugarEntries: HealthLogEntry[] = sugarData.map(reading => ({
        id: reading.id,
        type: 'blood_sugar',
        timestamp: reading.timestamp,
        primaryValue: reading.value,
        context: reading.context,
        notes: reading.notes,
        color: '#4B89DC', // Blue
        icon: 'analytics-outline'
      }));
      
      // Fetch insulin doses
      const insulinData = await getInsulinDoses();
      const insulinEntries: HealthLogEntry[] = insulinData.map(dose => ({
        id: dose.id,
        type: 'insulin',
        timestamp: dose.timestamp,
        primaryValue: dose.units,
        secondaryValue: dose.type,
        notes: dose.notes,
        color: '#F39C12', // Orange
        icon: 'medical-outline'
      }));
      
      // Fetch food entries
      const foodData = await getFoodEntries();
      const foodEntries: HealthLogEntry[] = foodData.map(entry => ({
        id: entry.id,
        type: 'food',
        timestamp: entry.timestamp,
        primaryValue: entry.name,
        secondaryValue: entry.carbs,
        notes: entry.notes,
        color: '#2ECC71', // Green
        icon: 'restaurant-outline'
      }));
      
      // Combine all entries and sort by timestamp (newest first)
      const combined = [...sugarEntries, ...insulinEntries, ...foodEntries]
        .sort((a, b) => b.timestamp - a.timestamp);
      
      setAllEntries(combined);
      
      // Apply time range and filter
      filterEntriesByTimeAndType(combined, selectedTimeRange, selectedFilter);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimeRange, selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchHealthData();
    }, [fetchHealthData])
  );

  useEffect(() => {
    if (allEntries.length > 0) {
      filterEntriesByTimeAndType(allEntries, selectedTimeRange, selectedFilter);
    }
  }, [allEntries, selectedTimeRange, selectedFilter, searchText]);
  
  // Calculate stats based on filtered entries
  useEffect(() => {
    if (selectedFilter === 'blood_sugar' || selectedFilter === 'all') {
      calculateStats();
    } else {
      setStats({
        avg: null,
        priorAvg: null,
        low: null,
        high: null
      });
    }
  }, [filteredEntries, selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
  };

  const calculateStats = () => {
    // Only calculate stats for blood sugar entries
    const bloodSugarEntries = filteredEntries.filter(entry => entry.type === 'blood_sugar');
    
    if (bloodSugarEntries.length === 0) {
      setStats({
        avg: null,
        priorAvg: null,
        low: null,
        high: null
      });
      return;
    }
    
    // Calculate current average, min, max for the selected period
    const values = bloodSugarEntries.map(entry => Number(entry.primaryValue));
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const low = Math.min(...values);
    const high = Math.max(...values);
    
    // Calculate prior average (same length of time before the current period)
    // For simplicity, we'll just use a placeholder value here
    // In a real app, you would fetch data from the prior period
    const priorAvg = null;
    
    setStats({
      avg: Math.round(avg),
      priorAvg,
      low,
      high
    });
  };

  const filterEntriesByTimeAndType = (entries: HealthLogEntry[], timeRange: TimeRange, type: LogEntryType) => {
    // First filter by time range
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    let daysToLookBack: number;
    
    switch (timeRange) {
      case '3d':
        daysToLookBack = 3;
        break;
      case '7d':
        daysToLookBack = 7;
        break;
      case '14d':
        daysToLookBack = 14;
        break;
      case '30d':
        daysToLookBack = 30;
        break;
      case '90d':
        daysToLookBack = 90;
        break;
    }
    
    const cutoffDate = now.getTime() - (daysToLookBack * msPerDay);
    let timeFiltered = entries.filter(entry => entry.timestamp >= cutoffDate);
    
    // Then filter by type if not "all"
    if (type !== 'all') {
      timeFiltered = timeFiltered.filter(entry => entry.type === type);
    }
    
    // Then apply search filter if there's search text
    if (searchText) {
      timeFiltered = timeFiltered.filter(entry => {
        const searchLower = searchText.toLowerCase();
        const primaryValueString = String(entry.primaryValue).toLowerCase();
        const secondaryValueString = entry.secondaryValue ? String(entry.secondaryValue).toLowerCase() : '';
        const notesString = entry.notes ? entry.notes.toLowerCase() : '';
        const contextString = entry.context ? entry.context.toLowerCase() : '';
        
        return primaryValueString.includes(searchLower) || 
               secondaryValueString.includes(searchLower) || 
               notesString.includes(searchLower) ||
               contextString.includes(searchLower);
      });
    }
    
    setFilteredEntries(timeFiltered);
  };

  const handleTimeRangeSelect = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleDelete = (entryId: number, entryType: string) => {
    // Implementation of delete functionality will depend on the entry type
    // For now, just show an alert
    alert(`Delete ${entryType} entry with ID ${entryId}`);
  };

  const handleEdit = (entry: HealthLogEntry) => {
    switch (entry.type) {
      case 'blood_sugar':
        navigation.navigate(ROUTES.ADD_GLUCOSE, { 
          readingId: entry.id, 
          initialData: {
            id: entry.id,
            value: Number(entry.primaryValue),
            timestamp: entry.timestamp,
            context: entry.context,
            notes: entry.notes
          } 
        });
        break;
      case 'insulin':
        navigation.navigate(ROUTES.ADD_INSULIN, { 
          doseId: entry.id, 
          initialData: {
            id: entry.id,
            units: Number(entry.primaryValue),
            type: String(entry.secondaryValue),
            timestamp: entry.timestamp,
            notes: entry.notes
          }
        });
        break;
      case 'food':
        navigation.navigate(ROUTES.ADD_FOOD, { 
          entryId: entry.id, 
          initialData: {
            id: entry.id,
            name: String(entry.primaryValue),
            carbs: entry.secondaryValue ? Number(entry.secondaryValue) : undefined,
            timestamp: entry.timestamp,
            notes: entry.notes
          }
        });
        break;
      // Add other cases as needed
    }
  };

  const handleAddReading = () => {
    // Navigate to the appropriate screen based on the selected filter
    switch (selectedFilter) {
      case 'blood_sugar':
        navigation.navigate('Home', { screen: ROUTES.ADD_GLUCOSE });
        break;
      case 'insulin':
        navigation.navigate('Home', { screen: ROUTES.ADD_INSULIN });
        break;
      case 'food':
        navigation.navigate('Home', { screen: ROUTES.ADD_FOOD });
        break;
      case 'a1c':
        navigation.navigate('Home', { screen: ROUTES.ADD_A1C });
        break;
      case 'weight':
        navigation.navigate('Home', { screen: ROUTES.ADD_WEIGHT });
        break;
      case 'bp':
        navigation.navigate('Home', { screen: ROUTES.ADD_BP });
        break;
      default:
        navigation.navigate('Home', { screen: ROUTES.ADD_GLUCOSE });
    }
  };

  const renderItem = ({ item }: { item: HealthLogEntry }) => {
    return (
      <Card variant="flat" style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryDateContainer}>
            <Text style={styles.entryDate}>{formatDate(new Date(item.timestamp))}</Text>
            <Text style={styles.entryTime}>{formatTime(new Date(item.timestamp))}</Text>
          </View>
          <View style={styles.entryTypeContainer}>
            <View style={[styles.entryTypeBadge, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon as any} size={14} color="white" />
              <Text style={styles.entryTypeBadgeText}>
                {item.type === 'blood_sugar' ? 'Blood Glucose' : 
                 item.type === 'insulin' ? 'Insulin' : 
                 item.type === 'food' ? 'Food' : 
                 item.type === 'a1c' ? 'A1C' :
                 item.type === 'weight' ? 'Weight' : 'BP'}
              </Text>
            </View>
          </View>
          <View style={styles.entryActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDelete(item.id, item.type)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.entryContent}>
          {item.type === 'blood_sugar' && (
            <Text style={[styles.entryValue, { color: Number(item.primaryValue) > 180 || Number(item.primaryValue) < 70 ? COLORS.warning : COLORS.success }]}>
              {item.primaryValue} {userSettings?.units || 'mg/dL'}
              {item.context && <Text style={styles.entryContext}> • {item.context.replace('_', ' ')}</Text>}
            </Text>
          )}
          
          {item.type === 'insulin' && (
            <Text style={styles.entryValue}>
              {item.primaryValue} units {item.secondaryValue && `(${item.secondaryValue})`}
            </Text>
          )}
          
          {item.type === 'food' && (
            <Text style={styles.entryValue}>
              {item.primaryValue}
              {item.secondaryValue && <Text style={styles.entrySecondary}> • {item.secondaryValue}g carbs</Text>}
            </Text>
          )}
          
          {item.notes && (
            <Text style={styles.entryNotes}>{item.notes}</Text>
          )}
        </View>
      </Card>
    );
  };
  
  const renderTimeRangeSelector = () => {
    return (
      <View style={styles.timeRangeContainer}>
        {(['3d', '7d', '14d', '30d', '90d'] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              selectedTimeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => handleTimeRangeSelect(range)}
          >
            <Text style={[
              styles.timeRangeButtonText,
              selectedTimeRange === range && styles.timeRangeButtonTextActive
            ]}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStatCard = () => {
    return (
      <Card variant="elevated" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={styles.statValue}>{stats.avg !== null ? stats.avg : '---'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Prior Avg</Text>
            <Text style={styles.statValue}>{stats.priorAvg !== null ? stats.priorAvg : '---'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Low</Text>
            <Text style={styles.statValue}>{stats.low !== null ? stats.low : '---'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>High</Text>
            <Text style={styles.statValue}>{stats.high !== null ? stats.high : '---'}</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderFilterChip = (label: string, filter: LogEntryType) => {
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === filter && styles.filterChipSelected
        ]}
        onPress={() => applyFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            selectedFilter === filter && styles.filterChipTextSelected
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const applyFilter = (filter: LogEntryType) => {
    setSelectedFilter(filter);
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="analytics-outline"
          size={80}
          color={COLORS.lightText}
        />
        <Text style={styles.emptyTitle}>No data available</Text>
        <Text style={styles.emptyText}>
          Start tracking your blood glucose readings by adding your first entry.
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowQuickActions(true)}
        >
          <Text style={styles.emptyButtonText}>Add Blood Glucose</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
              <Text style={styles.modalTitle}>Log Health Data</Text>
              <TouchableOpacity onPress={() => setShowQuickActions(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  navigation.navigate(ROUTES.ADD_GLUCOSE);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#4B89DC' }]}>
                  <Text style={styles.quickActionIconText}>📊</Text>
                </View>
                <Text style={styles.quickActionText}>Blood Glucose</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  navigation.navigate(ROUTES.ADD_INSULIN);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#F39C12' }]}>
                  <Text style={styles.quickActionIconText}>💉</Text>
                </View>
                <Text style={styles.quickActionText}>Insulin</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  navigation.navigate(ROUTES.ADD_FOOD);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#2ECC71' }]}>
                  <Text style={styles.quickActionIconText}>🍽️</Text>
                </View>
                <Text style={styles.quickActionText}>Food</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  navigation.navigate(ROUTES.ADD_A1C);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E74C3C' }]}>
                  <Text style={styles.quickActionIconText}>🔬</Text>
                </View>
                <Text style={styles.quickActionText}>A1C</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  navigation.navigate(ROUTES.ADD_WEIGHT);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#3498DB' }]}>
                  <Text style={styles.quickActionIconText}>⚖️</Text>
                </View>
                <Text style={styles.quickActionText}>Weight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  navigation.navigate(ROUTES.ADD_BP);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#16A085' }]}>
                  <Text style={styles.quickActionIconText}>❤️</Text>
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
    <Container scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Blood Glucose Log</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddReading}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Reading</Text>
        </TouchableOpacity>
      </View>

      {renderTimeRangeSelector()}
      
      {!isLoading && selectedFilter === 'blood_sugar' && renderStatCard()}

      <View style={styles.filtersContainer}>
        <View style={styles.tagsContainer}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {renderFilterChip('All', 'all')}
            {renderFilterChip('Blood Glucose', 'blood_sugar')}
            {renderFilterChip('Insulin', 'insulin')}
            {renderFilterChip('Food', 'food')}
            {renderFilterChip('A1C', 'a1c')}
          </ScrollView>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.lightText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries"
          placeholderTextColor={COLORS.lightText}
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredEntries.length === 0 ? (
        renderEmptyList()
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {renderQuickActionsModal()}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: SIZES.xs,
    alignItems: 'center',
    borderRadius: SIZES.xs,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  timeRangeButtonTextActive: {
    color: 'white',
  },
  statsCard: {
    marginBottom: SIZES.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  filtersContainer: {
    marginBottom: SIZES.sm,
    width: '100%',
  },
  tagsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  filterScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: SIZES.xs/2,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    marginBottom: SIZES.md,
  },
  searchIcon: {
    marginRight: SIZES.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.sm,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: SIZES.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    marginTop: SIZES.xs,
    marginBottom: SIZES.md,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.sm,
    marginTop: SIZES.sm,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  entryCard: {
    marginBottom: SIZES.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.xs,
  },
  entryDateContainer: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  entryTime: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  entryTypeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  entryTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 3,
    borderRadius: SIZES.xs,
  },
  entryTypeBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
    marginLeft: 2,
  },
  entryActions: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 4,
    marginLeft: SIZES.xs,
  },
  entryContent: {
    flexDirection: 'column',
  },
  entryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  entrySecondary: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  entryContext: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  entryNotes: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
    padding: SIZES.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SIZES.lg,
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
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SugarLogScreen; 