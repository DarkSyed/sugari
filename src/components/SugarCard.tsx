import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BloodSugarReading } from '../types';
import { COLORS, SIZES, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX, CRITICAL_SUGAR_LOW, CRITICAL_SUGAR_HIGH } from '../constants';
import Card from './Card';

interface SugarCardProps {
  reading: BloodSugarReading;
  onPress?: () => void;
}

const SugarCard: React.FC<SugarCardProps> = ({ reading, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (value: number) => {
    if (value <= CRITICAL_SUGAR_LOW) {
      return COLORS.error;
    } else if (value < NORMAL_SUGAR_MIN) {
      return COLORS.warning;
    } else if (value > CRITICAL_SUGAR_HIGH) {
      return COLORS.error;
    } else if (value > NORMAL_SUGAR_MAX) {
      return COLORS.warning;
    }
    return COLORS.success;
  };

  const getStatusText = (value: number) => {
    if (value <= CRITICAL_SUGAR_LOW) {
      return 'Critical Low';
    } else if (value < NORMAL_SUGAR_MIN) {
      return 'Low';
    } else if (value > CRITICAL_SUGAR_HIGH) {
      return 'Critical High';
    } else if (value > NORMAL_SUGAR_MAX) {
      return 'High';
    }
    return 'In Range';
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <Card variant="elevated">
        <View style={styles.container}>
          <View style={styles.valueContainer}>
            <Text style={[styles.valueText, { color: getStatusColor(reading.value) }]}>
              {reading.value}
            </Text>
            <Text style={styles.unitText}>mg/dL</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(reading.value) },
                ]}
              />
              <Text style={styles.statusText}>{getStatusText(reading.value)}</Text>
            </View>

            <Text style={styles.timeText}>{formatDate(reading.timestamp)}</Text>

            {reading.mealContext && (
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>
                  {reading.mealContext.replace('_', ' ')}
                </Text>
              </View>
            )}

            {reading.notes && <Text style={styles.notesText}>{reading.notes}</Text>}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: SIZES.md,
  },
  valueText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 2,
  },
  detailsContainer: {
    flex: 1,
    paddingLeft: SIZES.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 4,
  },
  tagContainer: {
    backgroundColor: COLORS.primary + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
});

export default SugarCard; 