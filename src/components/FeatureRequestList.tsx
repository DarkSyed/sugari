import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, ROUTES } from '../constants';
import Card from './Card';
import Button from './Button';
import { useNavigation } from '@react-navigation/native';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'under_review' | 'planned' | 'completed' | 'rejected';
  createdAt: number;
  updatedAt?: number;
}

interface FeatureRequestListProps {
  featureRequests: FeatureRequest[];
  isLoading: boolean;
  onAddRequest: () => void;
  onViewRequest: (request: FeatureRequest) => void;
}

const FeatureRequestList: React.FC<FeatureRequestListProps> = ({
  featureRequests,
  isLoading,
  onAddRequest,
  onViewRequest
}) => {
  const navigation = useNavigation();

  const getStatusColor = (status: FeatureRequest['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA500'; // Orange
      case 'under_review':
        return '#3498DB'; // Blue
      case 'planned':
        return '#9B59B6'; // Purple
      case 'completed':
        return '#2ECC71'; // Green
      case 'rejected':
        return '#E74C3C'; // Red
      default:
        return COLORS.lightText;
    }
  };

  const getStatusText = (status: FeatureRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'under_review':
        return 'Under Review';
      case 'planned':
        return 'Planned';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Not Planned';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderFeatureRequest = ({ item }: { item: FeatureRequest }) => (
    <TouchableOpacity 
      style={styles.requestItem}
      onPress={() => onViewRequest(item)}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.requestFooter}>
        <Text style={styles.requestDate}>
          Requested on {formatDate(item.createdAt)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.lightText} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bulb-outline" size={48} color={COLORS.lightText} />
      <Text style={styles.emptyTitle}>No Feature Requests Yet</Text>
      <Text style={styles.emptyText}>
        Have an idea for improving Sugari? Submit your first feature request!
      </Text>
      <Button
        title="Request a Feature"
        onPress={() => navigation.navigate(ROUTES.FEATURE_REQUESTS)}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <Card variant="elevated" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feature Requests</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate(ROUTES.FEATURE_REQUESTS)}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading feature requests...</Text>
        </View>
      ) : (
        <FlatList
          data={featureRequests}
          renderItem={renderFeatureRequest}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
    minHeight: 100,
  },
  requestItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.white,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: SIZES.sm,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDate: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 200,
  },
  loadingContainer: {
    padding: SIZES.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.sm,
    color: COLORS.lightText,
  },
});

export default FeatureRequestList;