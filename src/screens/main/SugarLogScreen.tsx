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
  getInsulinDoses, 
  getFoodEntries 
} from '../../services/database';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { useApp } from '../../contexts/AppContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';

// Health log entry types
type LogEntryType = 'blood_sugar' | 'insulin' | 'food' | 'a1c' | 'weight' | 'bp' | 'all';

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
      setFilteredEntries(combined);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHealthData();
    }, [fetchHealthData])
  );

  useEffect(() => {
    applyFilter(selectedFilter);
  }, [allEntries, selectedFilter, searchText]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
  };

  const applyFilter = (filter: LogEntryType) => {
    setSelectedFilter(filter);
    
    // First apply type filter
    let filtered = allEntries;
    if (filter !== 'all') {
      filtered = allEntries.filter(entry => entry.type === filter);
    }
    
    // Then apply search filter if there's search text
    if (searchText) {
      filtered = filtered.filter(entry => {
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
    
    setFilteredEntries(filtered);
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
        navigation.navigate(ROUTES.ADD_SUGAR, { 
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
            <View style={styles.entryValueContainer}>
              <Text style={[styles.entryValue, { color: item.color }]}>
                {item.primaryValue}
              </Text>
              <Text style={styles.entryUnit}>{userSettings?.units || 'mg/dL'}</Text>
              {item.context && (
                <View style={styles.entryContextContainer}>
                  <Text style={styles.entryContextLabel}>Context:</Text>
                  <Text style={styles.entryContext}>{item.context}</Text>
                </View>
              )}
            </View>
          )}
          
          {item.type === 'insulin' && (
            <View style={styles.entryValueContainer}>
              <Text style={[styles.entryValue, { color: item.color }]}>
                {item.primaryValue}
              </Text>
              <Text style={styles.entryUnit}>units</Text>
              <Text style={styles.entryType}>{item.secondaryValue}</Text>
            </View>
          )}
          
          {item.type === 'food' && (
            <View style={styles.entryValueContainer}>
              <Text style={[styles.entryValue, { color: item.color }]}>
                {item.primaryValue}
              </Text>
              {item.secondaryValue && (
                <View style={styles.entryCarbsContainer}>
                  <Text style={styles.entryCarbsLabel}>Carbs:</Text>
                  <Text style={styles.entryCarbs}>{item.secondaryValue}g</Text>
                </View>
              )}
            </View>
          )}
          
          {item.notes && (
            <View style={styles.entryNotesContainer}>
              <Text style={styles.entryNotesLabel}>Notes:</Text>
              <Text style={styles.entryNotes}>{item.notes}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };
  
  const renderFilterChip = (label: string, filter: LogEntryType) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity
        style={styles.filterChip}
        onPress={() => applyFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.filterChipTextSelected,
          ]}
        >
          {label}
        </Text>
        {isSelected && <View style={styles.filterChipIndicator} />}
      </TouchableOpacity>
    );
  };
  
  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color={COLORS.lightText} />
        <Text style={styles.emptyTitle}>No Health Logs</Text>
        <Text style={styles.emptyText}>
          {searchText || selectedFilter !== 'all'
            ? "No entries match your current filters. Try adjusting your search or filters."
            : "Start tracking your health metrics by adding your first entry."}
        </Text>
        
        {searchText || selectedFilter !== 'all' ? (
          <Button
            title="Clear Filters"
            onPress={() => {
              setSearchText('');
              setSelectedFilter('all');
            }}
            style={styles.emptyButton}
          />
        ) : (
          <Button
            title="Add Health Entry"
            onPress={() => setShowQuickActions(true)}
            style={styles.emptyButton}
          />
        )}
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
                  navigation.navigate(ROUTES.ADD_SUGAR);
                  setShowQuickActions(false);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#4B89DC' }]}>
                  <Text style={styles.quickActionIconText}>🩸</Text>
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
        <Text style={styles.title}>Health Log</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowQuickActions(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
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
        {renderFilterChip('Weight', 'weight')}
        {renderFilterChip('BP', 'bp')}
      </ScrollView>

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
    height: 40,
    fontSize: 16,
    color: COLORS.text,
  },
  filterScrollContent: {
    paddingRight: SIZES.md,
    marginBottom: SIZES.md,
  },
  filterChip: {
    marginRight: SIZES.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.sm,
  },
  filterChipText: {
    fontSize: 16,
    color: COLORS.lightText,
  },
  filterChipTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  filterChipIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  listContainer: {
    paddingBottom: SIZES.lg,
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
    padding: SIZES.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  entryCard: {
    marginBottom: SIZES.md,
    borderRadius: SIZES.sm,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  entryDateContainer: {
    flexDirection: 'column',
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  entryTime: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  entryTypeContainer: {
    flexDirection: 'row',
  },
  entryTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entryTypeBadgeText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 2,
  },
  entryActions: {
    flexDirection: 'row',
  },
  entryContent: {
    flexDirection: 'column',
  },
  entryValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  entryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: SIZES.xs,
  },
  entryUnit: {
    fontSize: 14,
    color: COLORS.lightText,
    marginRight: SIZES.md,
  },
  entryType: {
    fontSize: 16,
    color: COLORS.text,
  },
  entryContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  entryContextLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginRight: 4,
  },
  entryContext: {
    fontSize: 14,
    color: COLORS.text,
  },
  entryCarbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.md,
  },
  entryCarbsLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginRight: 4,
  },
  entryCarbs: {
    fontSize: 14,
    color: COLORS.text,
  },
  entryNotesContainer: {
    marginTop: SIZES.xs,
  },
  entryNotesLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 2,
  },
  entryNotes: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
    padding: SIZES.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default SugarLogScreen; 