import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, ROUTES } from '../constants';
import Button from './Button';

interface FeatureRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}

const FeatureRequestModal: React.FC<FeatureRequestModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setTitle('');
      setDescription('');
      setTitleError(null);
      setDescriptionError(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!title.trim()) {
      setTitleError('Please enter a title for your feature request');
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (!description.trim()) {
      setDescriptionError('Please describe your feature request');
      isValid = false;
    } else {
      setDescriptionError(null);
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      onSubmit(title, description);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request a Feature</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Feature Title</Text>
            <TextInput
              style={[styles.textInput, titleError ? styles.inputError : null]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for your feature request"
              placeholderTextColor={COLORS.lightText}
              maxLength={100}
            />
            {titleError && <Text style={styles.errorText}>{titleError}</Text>}

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textArea, descriptionError ? styles.inputError : null]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the feature you'd like to see in Sugari"
              placeholderTextColor={COLORS.lightText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            {descriptionError && <Text style={styles.errorText}>{descriptionError}</Text>}

            <Text style={styles.charCount}>
              {description.length}/500 characters
            </Text>

            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Your feature request will be reviewed by our team. We appreciate your feedback!
              </Text>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? "Submitting..." : "Submit Request"}
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  formContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    marginTop: SIZES.sm,
  },
  textInput: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    padding: SIZES.md,
    borderRadius: 8,
    marginTop: SIZES.md,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SIZES.xs,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.md,
  },
  cancelButton: {
    flex: 1,
    marginRight: SIZES.xs,
  },
  submitButton: {
    flex: 1,
    marginLeft: SIZES.xs,
  },
});

export default FeatureRequestModal;