import React, { useState, useEffect, useCallback } from "react";
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
  Platform,
  Alert,
  StyleProp,
  TextStyle,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  SIZES,
  ROUTES,
  NORMAL_SUGAR_MIN,
  NORMAL_SUGAR_MAX,
} from "../../constants";
import { BloodSugarReading, FoodEntry, InsulinDose } from "../../types";
import {
  getBloodSugarReadings,
  getFoodEntries,
  getInsulinDoses,
  deleteBloodSugarReading,
  getA1CReadings,
  getWeightMeasurements,
  getBloodPressureReadings,
  deleteInsulinDose,
  deleteFoodEntry,
  deleteA1CReading,
  deleteWeightMeasurement,
  deleteBloodPressureReading,
} from "../../services/database";
import {
  formatDate,
  formatTime,
  getStartOfDay,
  dateToTimestamp,
} from "../../utils/dateUtils";
import { useApp } from "../../contexts/AppContext";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";

// Health log entry types
type LogEntryType =
  | "blood_sugar"
  | "insulin"
  | "food"
  | "a1c"
  | "weight"
  | "bp"
  | "all";
type TimeRange = "3d" | "7d" | "14d" | "30d" | "90d" | "all";

// Combined log entry type for the unified log
interface HealthLogEntry {
  id: number;
  type: "blood_sugar" | "insulin" | "food" | "a1c" | "weight" | "bp";
  timestamp: number;
  primaryValue: number | string;
  secondaryValue?: number | string | null;
  tertiaryValue?: number | string | null;
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
  const [selectedFilter, setSelectedFilter] = useState<LogEntryType>("all");
  const [searchText, setSearchText] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("14d");
  const [stats, setStats] = useState<StatsData>({
    avg: null,
    priorAvg: null,
    low: null,
    high: null,
  });

  // Fetch all health data
  const fetchHealthData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch blood sugar readings
      const sugarData = await getBloodSugarReadings();
      const sugarEntries: HealthLogEntry[] = sugarData.map((reading) => ({
        id: reading.id,
        type: "blood_sugar",
        timestamp: reading.timestamp,
        primaryValue: reading.value,
        context: reading.context,
        notes: reading.notes,
        color: "#4B89DC", // Blue
        icon: "analytics-outline",
      }));

      // Fetch insulin doses
      const insulinData = await getInsulinDoses();
      const insulinEntries: HealthLogEntry[] = insulinData.map((dose) => ({
        id: dose.id,
        type: "insulin",
        timestamp: dose.timestamp,
        primaryValue: dose.units,
        secondaryValue: dose.type,
        notes: dose.notes,
        color: "#F39C12", // Orange
        icon: "medical-outline",
      }));

      // Fetch food entries
      const foodData = await getFoodEntries();
      const foodEntries: HealthLogEntry[] = foodData.map((entry) => ({
        id: entry.id,
        type: "food",
        timestamp: entry.timestamp,
        primaryValue: entry.name,
        secondaryValue: entry.carbs,
        tertiaryValue: entry.meal_type,
        notes: entry.notes,
        color: "#2ECC71", // Green
        icon: "restaurant-outline",
      }));

      // Fetch weight measurements
      const weightData = await getWeightMeasurements();
      const weightEntries: HealthLogEntry[] = weightData.map((measurement) => ({
        id: measurement.id,
        type: "weight",
        timestamp: measurement.timestamp,
        primaryValue: measurement.value,
        secondaryValue: "lbs", // Assuming weight is in pounds
        notes: measurement.notes,
        color: "#3498DB", // Blue
        icon: "fitness-outline",
      }));

      // Fetch A1C readings
      const a1cData = await getA1CReadings();
      const a1cEntries: HealthLogEntry[] = a1cData.map((reading) => ({
        id: reading.id,
        type: "a1c",
        timestamp: reading.timestamp,
        primaryValue: reading.value,
        secondaryValue: "%",
        notes: reading.notes,
        color: "#9B59B6", // Purple
        icon: "pulse-outline",
      }));

      // Fetch blood pressure readings
      const bpData = await getBloodPressureReadings();
      const bpEntries: HealthLogEntry[] = bpData.map((reading) => ({
        id: reading.id,
        type: "bp",
        timestamp: reading.timestamp,
        primaryValue: reading.systolic,
        secondaryValue: reading.diastolic,
        notes: reading.notes,
        color: "#E74C3C", // Red
        icon: "heart-outline",
      }));

      // Combine all entries and sort by timestamp (newest first)
      const combined = [
        ...sugarEntries,
        ...insulinEntries,
        ...foodEntries,
        ...weightEntries,
        ...a1cEntries,
        ...bpEntries,
      ].sort((a, b) => b.timestamp - a.timestamp);

      setAllEntries(combined);

      // Apply time range and filter
      const filtered = filterEntriesByTimeAndType(
        combined,
        selectedTimeRange,
        selectedFilter
      );
      setFilteredEntries(filtered);
    } catch (error) {
      console.error("Error fetching health data:", error);
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
    if (selectedFilter === "blood_sugar" || selectedFilter === "all") {
      calculateStats();
    } else {
      setStats({
        avg: null,
        priorAvg: null,
        low: null,
        high: null,
      });
    }
  }, [filteredEntries, selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
  };

  const calculateStats = () => {
    // Only calculate stats for blood sugar entries
    const bloodSugarEntries = filteredEntries.filter(
      (entry) => entry.type === "blood_sugar"
    );

    if (bloodSugarEntries.length === 0) {
      setStats({
        avg: null,
        priorAvg: null,
        low: null,
        high: null,
      });
      return;
    }

    // Calculate current average, min, max for the selected period
    const values = bloodSugarEntries.map((entry) => Number(entry.primaryValue));
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
      high,
    });
  };

  const filterEntriesByTimeAndType = (
    entries: HealthLogEntry[],
    timeRange: TimeRange,
    type: LogEntryType
  ) => {
    // First filter by time range
    const now = new Date().getTime();
    let daysToLookBack: number = 0;

    // Determine the number of days to look back based on time range
    switch (timeRange) {
      case "3d":
        daysToLookBack = 3;
        break;
      case "7d":
        daysToLookBack = 7;
        break;
      case "14d":
        daysToLookBack = 14;
        break;
      case "30d":
        daysToLookBack = 30;
        break;
      case "90d":
        daysToLookBack = 90;
        break;
      case "all":
        // For 'all', we'll return all entries without filtering by time
        daysToLookBack = 365 * 10; // Set to a very large number (10 years)
        break;
    }

    // Filter by time range first
    let timeFiltered = entries.filter((entry) => {
      return now - entry.timestamp <= daysToLookBack * 24 * 60 * 60 * 1000;
    });

    // Then filter by type if not 'all'
    if (type !== "all") {
      timeFiltered = timeFiltered.filter((entry) => entry.type === type);
    }

    // Then apply search filter if there's search text
    if (searchText) {
      timeFiltered = timeFiltered.filter((entry) => {
        const searchLower = searchText.toLowerCase();
        const primaryValueString = String(entry.primaryValue).toLowerCase();
        const secondaryValueString = entry.secondaryValue
          ? String(entry.secondaryValue).toLowerCase()
          : "";
        const notesString = entry.notes ? entry.notes.toLowerCase() : "";
        const contextString = entry.context ? entry.context.toLowerCase() : "";

        return (
          primaryValueString.includes(searchLower) ||
          secondaryValueString.includes(searchLower) ||
          notesString.includes(searchLower) ||
          contextString.includes(searchLower)
        );
      });
    }

    return timeFiltered;
  };

  const handleTimeRangeSelect = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);

    const filtered = filterEntriesByTimeAndType(
      allEntries,
      timeRange,
      selectedFilter
    );
    setFilteredEntries(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleDelete = (entryId: number, entryType: string) => {
    // Implementation of delete functionality will depend on the entry type
    // For now, just show an alert
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            switch (entryType) {
              case "blood_sugar":
                await deleteBloodSugarReading(entryId);
                break;
              case "insulin":
                await deleteInsulinDose(entryId);
                break;
              case "food":
                await deleteFoodEntry(entryId);
                break;
              case "a1c":
                await deleteA1CReading(entryId);
                break;
              case "weight":
                await deleteWeightMeasurement(entryId);
                break;
              case "bp":
                await deleteBloodPressureReading(entryId);
                break;
            }
            fetchHealthData(); // Refresh data after deletion
          } catch (error) {
            console.error("Error deleting entry:", error);
            Alert.alert("Error", "Failed to delete entry.");
          }
        },
      },
    ]);
  };

  const handleAddReading = () => {
    // Show the quick actions modal
    setShowQuickActions(true);
  };

  const renderItem = ({ item }: { item: HealthLogEntry }) => {
    // Format the date and time
    const date = new Date(item.timestamp);
    const formattedDate = formatDate(date);
    const formattedTime = formatTime(date);

    // Format the value based on the type
    let valueDisplay =
      typeof item.primaryValue === "number"
        ? item.primaryValue.toString()
        : item.primaryValue;

    let secondaryDisplay = "";
    let tertiaryDisplay = "";

    // Get color for blood sugar values
    const getBloodSugarColor = (value: number) => {
      if (value < NORMAL_SUGAR_MIN) {
        return COLORS.danger; // Low
      } else if (value > NORMAL_SUGAR_MAX) {
        return COLORS.warning; // High
      } else {
        return COLORS.success; // Normal
      }
    };

    // Set text color based on entry type
    let valueTextStyle: StyleProp<TextStyle> = styles.entryValue;
    if (item.type === "blood_sugar") {
      const numericValue =
        typeof item.primaryValue === "number"
          ? item.primaryValue
          : parseFloat(item.primaryValue.toString());

      valueTextStyle = {
        ...styles.entryValue,
        color: getBloodSugarColor(numericValue),
      };
    }

    // Handle special formatting for blood pressure
    if (item.type === "bp") {
      valueDisplay = `${item.primaryValue}/${item.secondaryValue} mmHg`;
      secondaryDisplay = "";
    } else if (item.secondaryValue) {
      secondaryDisplay = ` • ${item.secondaryValue}`;
    }

    if (item.tertiaryValue)
      tertiaryDisplay = ` • ${
        item.tertiaryValue.toString().charAt(0).toUpperCase() +
        item.tertiaryValue.toString().slice(1)
      } `;

    // Format the meal context text for display
    const formatContextText = (context: string | null | undefined): string => {
      if (!context) return "";

      // Replace underscores with spaces and capitalize each word
      return context
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    let contextDisplay = item.context
      ? ` • ${formatContextText(item.context)}`
      : "";

    // Handle the click on an entry to edit/view
    const handleEntryPress = () => {
      switch (item.type) {
        case "blood_sugar":
          navigation.navigate(ROUTES.ADD_GLUCOSE, {
            readingId: item.id,
            initialData: {
              id: item.id,
              value:
                typeof item.primaryValue === "number"
                  ? item.primaryValue
                  : parseFloat(item.primaryValue as string),
              timestamp: item.timestamp,
              context: item.context,
              notes: item.notes,
            },
            isEditing: true,
          });
          break;
        case "insulin":
          navigation.navigate(ROUTES.ADD_INSULIN, {
            doseId: item.id,
            initialData: {
              id: item.id,
              units:
                typeof item.primaryValue === "number"
                  ? item.primaryValue
                  : parseFloat(item.primaryValue as string),
              type:
                typeof item.secondaryValue === "string"
                  ? item.secondaryValue
                  : "rapid",
              timestamp: item.timestamp,
              notes: item.notes,
            },
            isEditing: true,
          });
          break;
        case "food":
          navigation.navigate(ROUTES.ADD_FOOD, {
            entryId: item.id,
            initialData: {
              id: item.id,
              name: item.primaryValue.toString(),
              carbs:
                typeof item.secondaryValue === "number"
                  ? item.secondaryValue
                  : item.secondaryValue
                  ? parseFloat(item.secondaryValue.toString())
                  : null,
              timestamp: item.timestamp,
              meal_type: item.tertiaryValue,
              notes: item.notes,
            },
            isEditing: true,
          });
          break;
        case "weight":
          navigation.navigate(ROUTES.ADD_WEIGHT, {
            measurementId: item.id,
            initialData: {
              id: item.id,
              value:
                typeof item.primaryValue === "number"
                  ? item.primaryValue
                  : parseFloat(item.primaryValue as string),
              timestamp: item.timestamp,
              notes: item.notes,
            },
            isEditing: true,
          });
          break;
        case "a1c":
          navigation.navigate(ROUTES.ADD_A1C, {
            readingId: item.id,
            initialData: {
              id: item.id,
              value:
                typeof item.primaryValue === "number"
                  ? item.primaryValue
                  : parseFloat(item.primaryValue as string),
              timestamp: item.timestamp,
              notes: item.notes,
            },
            isEditing: true,
          });
          break;
        case "bp":
          // For blood pressure, the primaryValue would be systolic and secondaryValue diastolic
          navigation.navigate(ROUTES.ADD_BP, {
            readingId: item.id,
            initialData: {
              id: item.id,
              systolic:
                typeof item.primaryValue === "number"
                  ? item.primaryValue
                  : parseFloat(item.primaryValue as string),
              diastolic:
                typeof item.secondaryValue === "number"
                  ? item.secondaryValue
                  : item.secondaryValue
                  ? parseFloat(item.secondaryValue.toString())
                  : 0,
              timestamp: item.timestamp,
              notes: item.notes,
            },
            isEditing: true,
          });
          break;
      }
    };

    return (
      <TouchableOpacity onPress={handleEntryPress}>
        <Card style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={styles.entryDate}>{formattedDate}</Text>
              <Text style={styles.entryTime}>{formattedTime}</Text>
            </View>

            <View style={styles.entryType}>
              <View
                style={[styles.entryTypeBadge, { backgroundColor: item.color }]}
              >
                <Ionicons name={item.icon as any} size={16} color="white" />
                <Text style={styles.entryTypeText}>
                  {item.type.replace("_", " ")}
                </Text>
              </View>
            </View>

            <View style={styles.entryActions}>
              <TouchableOpacity
                onPress={handleEntryPress}
                style={styles.actionButton}
              >
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.type)}
                style={styles.actionButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={COLORS.danger}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.entryContent}>
            <Text style={valueTextStyle}>
              {valueDisplay}
              {secondaryDisplay}
              {tertiaryDisplay}
              {contextDisplay}
            </Text>
            {item.notes && <Text style={styles.entryNotes}>{item.notes}</Text>}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderTimeRangeSelector = () => {
    return (
      <View style={styles.timeRangeContainer}>
        {(["3d", "7d", "14d", "30d", "90d", "all"] as TimeRange[]).map(
          (range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => handleTimeRangeSelect(range)}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  selectedTimeRange === range &&
                    styles.timeRangeButtonTextActive,
                ]}
              >
                {range === "all" ? "ALL" : range.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  const renderStatCard = () => {
    return (
      <Card variant="elevated" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={styles.statValue}>
              {stats.avg !== null ? stats.avg : "---"}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Prior Avg</Text>
            <Text style={styles.statValue}>
              {stats.priorAvg !== null ? stats.priorAvg : "---"}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Low</Text>
            <Text style={styles.statValue}>
              {stats.low !== null ? stats.low : "---"}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>High</Text>
            <Text style={styles.statValue}>
              {stats.high !== null ? stats.high : "---"}
            </Text>
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
          selectedFilter === filter && styles.activeFilterChip,
        ]}
        onPress={() => applyFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            selectedFilter === filter && styles.activeFilterChipText,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const applyFilter = (filter: LogEntryType) => {
    setSelectedFilter(filter);
    // Apply the filter to the entries
    const filtered = filterEntriesByTimeAndType(
      allEntries,
      selectedTimeRange,
      filter
    );
    setFilteredEntries(filtered);
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={80} color={COLORS.lightText} />
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
        statusBarTranslucent={true}
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#4B89DC" },
                  ]}
                >
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#F39C12" },
                  ]}
                >
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#2ECC71" },
                  ]}
                >
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#E74C3C" },
                  ]}
                >
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#3498DB" },
                  ]}
                >
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
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#16A085" },
                  ]}
                >
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      <Container scrollable={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Blood Glucose Log</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddReading}>
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Reading</Text>
          </TouchableOpacity>
        </View>

        {renderTimeRangeSelector()}

        {!isLoading && selectedFilter === "blood_sugar" && renderStatCard()}

        <View style={styles.filtersContainer}>
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {renderFilterChip("All", "all")}
              {renderFilterChip("Blood Sugar", "blood_sugar")}
              {renderFilterChip("Insulin", "insulin")}
              {renderFilterChip("Food", "food")}
              {renderFilterChip("Weight", "weight")}
              {renderFilterChip("A1C", "a1c")}
              {renderFilterChip("Blood Pressure", "bp")}
            </ScrollView>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.lightText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries"
            placeholderTextColor={COLORS.lightText}
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.lightText}
              />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: SIZES.sm,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 14,
  },
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.sm,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: SIZES.xs,
    alignItems: "center",
    borderRadius: SIZES.xs,
  },
  timeRangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
  },
  timeRangeButtonTextActive: {
    color: "white",
  },
  statsCard: {
    marginBottom: SIZES.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  filtersContainer: {
    marginBottom: SIZES.sm,
    width: "100%",
  },
  tagsContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  filterScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: SIZES.xs / 2,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: SIZES.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: "center",
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
    color: "white",
    fontWeight: "bold",
  },
  entryCard: {
    marginBottom: SIZES.sm,
    borderRadius: SIZES.xs,
    overflow: "hidden",
    padding: SIZES.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.xs,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  entryTime: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  entryType: {
    flexDirection: "row",
  },
  entryTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.xs,
  },
  entryTypeText: {
    fontSize: 12,
    color: "white",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  entryActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 6,
    marginLeft: SIZES.xs,
  },
  entryContent: {
    marginTop: SIZES.xs,
  },
  entryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  entryNotes: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
    padding: SIZES.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: SIZES.lg,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.xs,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
  },
});

export default SugarLogScreen;
