import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { BloodGlucoseReading } from '../../types';
import { getBloodGlucoseReadings } from '../../services/supabase';
import Container from '../../components/Container';
import GlucoseCard from '../../components/GlucoseCard';
import Button from '../../components/Button';

type FilterOption = 'all' | 'high' | 'normal' | 'low' | 'before_meal' | 'after_meal' | 'fasting' | 'bedtime';

const GlucoseLogScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [readings, setReadings] = useState<BloodGlucoseReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodGlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [searchText, setSearchText] = useState('');

  const fetchGlucoseReadings = useCallback(async () => {
    if (!authState.user) return;

    try {
      const { data, error } = await getBloodGlucoseReadings(authState.user.id);
      
      if (error) {
        console.error('Error fetching glucose readings:', error);
      } else if (data) {
        // Sort readings by timestamp (newest first)
        const sortedData = [...data].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setReadings(sortedData);
        setFilteredReadings(sortedData);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGlucoseReadings();
    setRefreshing(false);
  };

  const applyFilter = (filter: FilterOption) => {
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.notes?.toLowerCase().includes(searchText.toLowerCase()) || searchText === ''
        )
      );
      return;
    }

    // Apply glucose range filters
    if (filter === 'high') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.value > 180 && 
          (reading.notes?.toLowerCase().includes(searchText.toLowerCase()) || searchText === '')
        )
      );
      return;
    }

    if (filter === 'normal') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.value >= 70 && reading.value <= 180 && 
          (reading.notes?.toLowerCase().includes(searchText.toLowerCase()) || searchText === '')
        )
      );
      return;
    }

    if (filter === 'low') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.value < 70 && 
          (reading.notes?.toLowerCase().includes(searchText.toLowerCase()) || searchText === '')
        )
      );
      return;
    }

    // Apply meal context filters
    setFilteredReadings(
      readings.filter(reading => 
        reading.mealContext === filter && 
        (reading.notes?.toLowerCase().includes(searchText.toLowerCase()) || searchText === '')
      )
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    
    // Apply current filter with new search text
    if (activeFilter === 'all') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.notes?.toLowerCase().includes(text.toLowerCase()) || text === ''
        )
      );
      return;
    }

    // Apply glucose range filters with search
    if (activeFilter === 'high') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.value > 180 && 
          (reading.notes?.toLowerCase().includes(text.toLowerCase()) || text === '')
        )
      );
      return;
    }

    if (activeFilter === 'normal') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.value >= 70 && reading.value <= 180 && 
          (reading.notes?.toLowerCase().includes(text.toLowerCase()) || text === '')
        )
      );
      return;
    }

    if (activeFilter === 'low') {
      setFilteredReadings(
        readings.filter(reading => 
          reading.value < 70 && 
          (reading.notes?.toLowerCase().includes(text.toLowerCase()) || text === '')
        )
      );
      return;
    }

    // Apply meal context filters with search
    setFilteredReadings(
      readings.filter(reading => 
        reading.mealContext === activeFilter && 
        (reading.notes?.toLowerCase().includes(text.toLowerCase()) || text === '')
      )
    );
  };

  const renderFilterChip = (label: string, filter: FilterOption) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        activeFilter === filter && styles.filterChipActive,
      ]}
      onPress={() => applyFilter(filter)}
    >
      <Text
        style={[
          styles.filterChipText,
          activeFilter === filter && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No glucose readings found</Text>
      <Text style={styles.emptySubText}>
        {readings.length === 0
          ? "You haven't logged any readings yet."
          : "No readings match your current filters."}
      </Text>
      {readings.length === 0 && (
        <Button
          title="Add First Reading"
          onPress={() => navigation.navigate(ROUTES.ADD_GLUCOSE)}
          style={styles.addButton}
        />
      )}
    </View>
  );

  return (
    <Container scrollable={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Glucose Log</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate(ROUTES.ADD_GLUCOSE)}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.lightText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.lightText}
          />
          {searchText !== '' && (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                applyFilter(activeFilter);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.lightText} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
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
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredReadings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <GlucoseCard
                reading={item}
                onPress={() => {
                  // Navigate to detailed view or edit screen
                  // To be implemented later
                }}
              />
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyList}
          />
        )}
      </View>
    </Container>
  );
};

// Helper component for horizontal scrollable filter chips
const ScrollableFilterSection: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.scrollableFilterContainer}>
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ id: 'filters', content: children }]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <React.Fragment>{item.content}</React.Fragment>}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    padding: SIZES.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SIZES.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: COLORS.text,
  },
  filtersContainer: {
    marginBottom: SIZES.md,
  },
  scrollableFilterContainer: {
    width: '100%',
  },
  filterChip: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.lg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    marginRight: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingBottom: SIZES.lg,
    flexGrow: 1,
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
    marginBottom: SIZES.md,
  },
  addFirstButton: {
    marginTop: SIZES.md,
  },
});

export default GlucoseLogScreen; 