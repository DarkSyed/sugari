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
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { BloodSugarReading } from '../../types';
import { getBloodSugarReadings } from '../../services/supabase';
import Container from '../../components/Container';
import GlucoseCard from '../../components/GlucoseCard';
import Button from '../../components/Button';

type FilterOption = 'all' | 'high' | 'normal' | 'low' | 'before_meal' | 'after_meal' | 'fasting' | 'bedtime';

const SugarLogScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodSugarReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [searchText, setSearchText] = useState('');

  const fetchReadings = useCallback(async () => {
    if (!authState.user) {
      return;
    }

    try {
      const { data, error } = await getBloodSugarReadings(authState.user.id);
      if (error) {
        console.error('Error fetching readings:', error);
      } else if (data) {
        setReadings(data);
        setFilteredReadings(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [authState.user]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  useEffect(() => {
    applyFilter(selectedFilter);
  }, [readings, selectedFilter, searchText]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReadings();
  };

  const applyFilter = (filter: FilterOption) => {
    setSelectedFilter(filter);
    
    // Apply search text first
    let filtered = readings;
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(reading => {
        const hasMatchInNotes = reading.notes && reading.notes.toLowerCase().includes(searchLower);
        const hasMatchInValue = reading.value.toString().includes(searchLower);
        return hasMatchInNotes || hasMatchInValue;
      });
    }
    
    // Then apply the selected filter
    switch (filter) {
      case 'high':
        filtered = filtered.filter(reading => reading.value > 180);
        break;
      case 'normal':
        filtered = filtered.filter(reading => reading.value >= 70 && reading.value <= 180);
        break;
      case 'low':
        filtered = filtered.filter(reading => reading.value < 70);
        break;
      case 'before_meal':
        filtered = filtered.filter(reading => reading.mealContext === 'before_meal');
        break;
      case 'after_meal':
        filtered = filtered.filter(reading => reading.mealContext === 'after_meal');
        break;
      case 'fasting':
        filtered = filtered.filter(reading => reading.mealContext === 'fasting');
        break;
      case 'bedtime':
        filtered = filtered.filter(reading => reading.mealContext === 'bedtime');
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    setFilteredReadings(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const renderItem = ({ item }: { item: BloodSugarReading }) => (
    <GlucoseCard reading={item} />
  );

  return (
    <Container scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Blood Sugar Log</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate(ROUTES.ADD_SUGAR)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.lightText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search readings"
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

      <ScrollableFilterSection>
        {renderFilterChip('All', 'all')}
        {renderFilterChip('High', 'high')}
        {renderFilterChip('Normal', 'normal')}
        {renderFilterChip('Low', 'low')}
        {renderFilterChip('Before Meal', 'before_meal')}
        {renderFilterChip('After Meal', 'after_meal')}
        {renderFilterChip('Fasting', 'fasting')}
        {renderFilterChip('Bedtime', 'bedtime')}
      </ScrollableFilterSection>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredReadings.length === 0 ? (
        renderEmptyList()
      ) : (
        <FlatList
          data={filteredReadings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </Container>
  );

  function renderFilterChip(label: string, filter: FilterOption) {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: COLORS.primary },
        ]}
        onPress={() => applyFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && { color: 'white' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderEmptyList() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color={COLORS.lightText} />
        <Text style={styles.emptyTitle}>No Blood Sugar Readings</Text>
        <Text style={styles.emptyText}>
          {searchText || selectedFilter !== 'all'
            ? "No readings match your current filters. Try adjusting your search or filters."
            : "Start tracking your blood sugar levels by adding your first reading."}
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
            title="Add First Reading"
            onPress={() => navigation.navigate(ROUTES.ADD_SUGAR)}
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  }
};

const ScrollableFilterSection: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.filterSectionContainer}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
    >
      {children}
    </ScrollView>
  </View>
);

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
  filterSectionContainer: {
    marginBottom: SIZES.md,
  },
  filterScrollContent: {
    paddingRight: SIZES.md,
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: 50,
    backgroundColor: COLORS.inputBackground,
    marginRight: SIZES.xs,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
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
});

export default SugarLogScreen; 