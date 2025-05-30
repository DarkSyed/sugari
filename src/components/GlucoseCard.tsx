import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BloodSugarReading } from '../types';
import { COLORS, SIZES, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX, CRITICAL_SUGAR_LOW, CRITICAL_SUGAR_HIGH } from '../constants';
import Card from './Card';
import { useApp } from '../contexts/AppContext';

interface GlucoseCardProps {
  reading: BloodSugarReading;
  onPress?: () => void;
}

const GlucoseCard: React.FC<GlucoseCardProps> = ({ reading, onPress }) => {
  const { userSettings } = useApp();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getColorForValue = (glucoseValue: number) => {
    // Get thresholds from user settings with fallbacks
    const isFasting = reading.context === 'fasting' || reading.context === 'before_meal';
    
    const lowThreshold = isFasting 
      ? (userSettings?.fastingLowThreshold || 70)
      : (userSettings?.targetLowThreshold || 70);
      
    const highThreshold = isFasting
      ? (userSettings?.fastingHighThreshold || 150)
      : (userSettings?.targetHighThreshold || 180);
    
    // Calculate very low/high thresholds
    const veryLowThreshold = lowThreshold - 15;
    const veryHighThreshold = highThreshold + 70;
    
    // Return colors based on thresholds
    if (glucoseValue < veryLowThreshold) return COLORS.danger;
    if (glucoseValue < lowThreshold) return COLORS.warning;
    if (glucoseValue > veryHighThreshold) return COLORS.danger;
    if (glucoseValue > highThreshold) return COLORS.warning;
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
            <Text style={[styles.valueText, { color: getColorForValue(reading.value) }]}>
              {reading.value}
            </Text>
            <Text style={styles.unitText}>mg/dL</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getColorForValue(reading.value) },
                ]}
              />
              <Text style={styles.statusText}>{getStatusText(reading.value)}</Text>
            </View>

            <Text style={styles.timeText}>{formatDate(reading.timestamp)}</Text>

            {reading.context && (
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>
                  {reading.context.replace('_', ' ')}
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

export default GlucoseCard; 