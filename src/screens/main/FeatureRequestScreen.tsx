import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { COLORS, SIZES } from "../../constants";
import FeatureRequestModal from "../../components/FeatureRequestModal";
import FeatureRequestList, {
  FeatureRequest,
} from "../../components/FeatureRequestList";
import Container from "../../components/Container";

// Generate a unique ID for feature requests
const generateId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const FeatureRequestDetailModal: React.FC<{
  visible: boolean;
  request: FeatureRequest | null;
  onClose: () => void;
}> = ({ visible, request, onClose }) => {
  if (!request) return null;

  const getStatusColor = (status: FeatureRequest["status"]) => {
    switch (status) {
      case "pending":
        return "#FFA500"; // Orange
      case "under_review":
        return "#3498DB"; // Blue
      case "planned":
        return "#9B59B6"; // Purple
      case "completed":
        return "#2ECC71"; // Green
      case "rejected":
        return "#E74C3C"; // Red
      default:
        return COLORS.lightText;
    }
  };

  const getStatusText = (status: FeatureRequest["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "under_review":
        return "Under Review";
      case "planned":
        return "Planned";
      case "completed":
        return "Completed";
      case "rejected":
        return "Not Planned";
      default:
        return "Unknown";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feature Request Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{request.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(request.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(request.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.dateText}>
              Submitted on {formatDate(request.createdAt)}
            </Text>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{request.description}</Text>
            </View>

            <View style={styles.statusInfoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.statusInfoText}>
                {request.status === "pending" &&
                  "Your request is being reviewed by our team."}
                {request.status === "under_review" &&
                  "Our team is currently evaluating this feature."}
                {request.status === "planned" &&
                  "This feature has been approved and will be implemented in a future update."}
                {request.status === "completed" &&
                  "This feature has been implemented and is now available."}
                {request.status === "rejected" &&
                  "After careful consideration, we have decided not to implement this feature at this time."}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const FeatureRequestScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load feature requests from AsyncStorage
  useEffect(() => {
    loadFeatureRequests();
  }, []);

  const loadFeatureRequests = async () => {
    try {
      setIsLoading(true);
      const storedRequests = await AsyncStorage.getItem("featureRequests");

      if (storedRequests) {
        setFeatureRequests(JSON.parse(storedRequests));
      } else {
        // Initialize with empty array if no requests exist
        setFeatureRequests([]);
      }
    } catch (error) {
      console.error("Error loading feature requests:", error);
      Alert.alert("Error", "Failed to load feature requests");
    } finally {
      setIsLoading(false);
    }
  };

  const saveFeatureRequests = async (requests: FeatureRequest[]) => {
    try {
      await AsyncStorage.setItem("featureRequests", JSON.stringify(requests));
    } catch (error) {
      console.error("Error saving feature requests:", error);
      Alert.alert("Error", "Failed to save feature request");
    }
  };

  const handleAddRequest = (title: string, description: string) => {
    const newRequest: FeatureRequest = {
      id: generateId(),
      title,
      description,
      status: "pending",
      createdAt: Date.now(),
    };

    const updatedRequests = [newRequest, ...featureRequests];
    setFeatureRequests(updatedRequests);
    saveFeatureRequests(updatedRequests);

    Alert.alert(
      "Feature Request Submitted",
      "Thank you for your feedback! Your feature request has been submitted successfully.",
    );
  };

  const handleViewRequest = (request: FeatureRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Feature Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Have an idea to improve Sugari? Submit your feature requests and help
          us make the app better for everyone.
        </Text>

        <FeatureRequestList
          featureRequests={featureRequests}
          isLoading={isLoading}
          onAddRequest={() => setShowRequestModal(true)}
          onViewRequest={handleViewRequest}
        />
      </ScrollView>

      <FeatureRequestModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleAddRequest}
      />

      <FeatureRequestDetailModal
        visible={showDetailModal}
        request={selectedRequest}
        onClose={() => setShowDetailModal(false)}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SIZES.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: SIZES.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.lg,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  modalBody: {
    marginBottom: SIZES.lg,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SIZES.sm,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.white,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: SIZES.md,
  },
  descriptionContainer: {
    marginBottom: SIZES.md,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  statusInfoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 102, 204, 0.1)",
    padding: SIZES.md,
    borderRadius: 8,
    marginTop: SIZES.sm,
    alignItems: "flex-start",
  },
  statusInfoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SIZES.xs,
    flex: 1,
    lineHeight: 20,
  },
  closeModalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SIZES.sm,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FeatureRequestScreen;
