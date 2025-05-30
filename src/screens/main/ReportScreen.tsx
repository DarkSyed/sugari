import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DateRangeModal from '../../components/DateRangeModal';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { generatePDF, generateCSV } from '../../services/pdfGenerator';
import { getHealthDataForDateRange } from '../../services/reportService';
import Container from '../../components/Container';

const ReportScreen: React.FC = () => {
  const { userSettings } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [showFormatModal, setShowFormatModal] = useState(false);
  
  useEffect(() => {
    // Set default date range to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start);
    setEndDate(end);
  }, []);
  
  const handleDateRangeSelect = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setIsDateRangeModalVisible(false);
    setShowFormatModal(true);
  };
  
  const handleFormatSelect = (format: 'pdf' | 'csv') => {
    setReportFormat(format);
    setShowFormatModal(false);
    generateReport(format);
  };
  
  const generateReport = async (format: 'pdf' | 'csv') => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select a date range first');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Get health data for the selected date range
      const healthData = await getHealthDataForDateRange(startDate, endDate);
      
      let fileUri;
      let fileName;
      
      if (format === 'pdf') {
        // Generate PDF
        fileUri = await generatePDF(
          healthData.bloodSugarReadings,
          healthData.insulinDoses,
          healthData.foodEntries,
          healthData.a1cReadings,
          healthData.weightMeasurements,
          healthData.bloodPressureReadings,
          healthData.userSettings,
          startDate,
          endDate
        );
        
        fileName = fileUri.split('/').pop() || 'health_report.pdf';
      } else {
        // Generate CSV
        const csvFiles = await generateCSV(
          healthData.bloodSugarReadings,
          healthData.insulinDoses,
          healthData.foodEntries,
          healthData.a1cReadings,
          healthData.weightMeasurements,
          healthData.bloodPressureReadings,
          startDate,
          endDate
        );
        
        fileUri = csvFiles[0]; // Use the first CSV file for sharing
        fileName = fileUri.split('/').pop() || 'health_data.csv';
      }
      
      // Share the file
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(fileUri);
      } else {
        // For Android, use the Share API
        await Share.share({
          title: 'Health Report',
          message: 'Here is your health report',
          url: `file://${fileUri}`
        });
      }
      
      Alert.alert(
        'Success',
        `Your ${format.toUpperCase()} report has been generated successfully.`
      );
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date range';
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };
  
  const handleBackPress = () => {
    const canGoBack = navigation.canGoBack();
    if (canGoBack) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.SETTINGS);
    }
  };
  
  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Health Reports</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Generate comprehensive reports of your health data for a selected time period. 
          You can choose between PDF and CSV formats.
        </Text>
        
        <Card variant="elevated" style={styles.reportOption}>
          <View style={styles.optionHeader}>
            <View style={styles.optionIcon}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Complete Health Report</Text>
              <Text style={styles.optionDescription}>A comprehensive report with all your health data and statistics</Text>
            </View>
          </View>
          
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeLabel}>Date Range:</Text>
            <TouchableOpacity 
              style={styles.dateRangeButton}
              onPress={() => setIsDateRangeModalVisible(true)}
            >
              <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.contentLabel}>Includes:</Text>
          <View style={styles.contentList}>
            <View style={styles.contentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.contentText}>Blood Sugar Readings</Text>
            </View>
            <View style={styles.contentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.contentText}>Insulin Doses</Text>
            </View>
            <View style={styles.contentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.contentText}>Food Log</Text>
            </View>
            <View style={styles.contentItem}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.contentText}>Statistics & Trends</Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Generate Report"
              onPress={() => setShowFormatModal(true)}
              loading={isGenerating}
              disabled={isGenerating || !startDate || !endDate}
            />
          </View>
        </Card>
      </ScrollView>
      
      {/* Date Range Modal */}
      <DateRangeModal
        visible={isDateRangeModalVisible}
        onClose={() => setIsDateRangeModalVisible(false)}
        onApply={handleDateRangeSelect}
      />
      
      {/* Format Selection Modal */}
      <Modal
        visible={showFormatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFormatModal(false)}
      >
        <View style={styles.formatModalContainer}>
          <View style={styles.formatModalContent}>
            <Text style={styles.formatModalTitle}>Choose Format</Text>
            
            <TouchableOpacity 
              style={styles.formatOption}
              onPress={() => handleFormatSelect('pdf')}
            >
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <View style={styles.formatOptionTextContainer}>
                <Text style={styles.formatOptionTitle}>PDF Document</Text>
                <Text style={styles.formatOptionDescription}>A formatted report that's easy to read and print</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.formatOption}
              onPress={() => handleFormatSelect('csv')}
            >
              <Ionicons name="grid" size={24} color={COLORS.primary} />
              <View style={styles.formatOptionTextContainer}>
                <Text style={styles.formatOptionTitle}>CSV Files</Text>
                <Text style={styles.formatOptionDescription}>Raw data files for analysis in spreadsheet software</Text>
              </View>
            </TouchableOpacity>
            
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowFormatModal(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: 'bold',
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
  reportOption: {
    marginBottom: SIZES.lg,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight || '#e6effd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  dateRangeLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginRight: SIZES.sm,
  },
  dateRangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  dateRangeText: {
    fontSize: 14,
    color: COLORS.text,
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  contentList: {
    marginBottom: SIZES.md,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  buttonContainer: {
    marginTop: SIZES.sm,
  },
  formatModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formatModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.lg,
  },
  formatModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  formatOptionTextContainer: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  formatOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  formatOptionDescription: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  cancelButton: {
    marginTop: SIZES.sm,
  },
});

export default ReportScreen;
