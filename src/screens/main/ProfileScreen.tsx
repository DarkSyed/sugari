import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';

const ProfileScreen: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();

  const handleLogout = async () => {
    try {
      const { error } = await logout();
      if (error) {
        Alert.alert('Logout Failed', error.message);
      }
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
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
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {authState.user?.firstName?.[0] || authState.user?.email?.[0] || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {authState.user?.firstName
              ? `${authState.user.firstName} ${authState.user.lastName || ''}`
              : authState.user?.email || 'User'}
          </Text>
          <Text style={styles.userEmail}>{authState.user?.email}</Text>
        </View>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{authState.user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>First Name</Text>
            <Text style={styles.infoValue}>{authState.user?.firstName || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Name</Text>
            <Text style={styles.infoValue}>{authState.user?.lastName || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Diabetes Type</Text>
            <Text style={styles.infoValue}>{authState.user?.diabetesType || 'Not set'}</Text>
          </View>
          <Button
            title="Edit Profile"
            variant="outline"
            style={styles.editButton}
            onPress={() => {
              // Navigate to edit profile screen (to be implemented)
              Alert.alert('Coming Soon', 'This feature will be available in a future update');
            }}
          />
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.settingsRow}>
            <Ionicons name="lock-closed-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Ionicons name="shield-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.settingsRow}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>About Sugari</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
        </Card>

        <Button
          title="Log Out"
          variant="outline"
          style={styles.logoutButton}
          onPress={handleLogout}
        />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.lightText,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  editButton: {
    marginTop: SIZES.md,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SIZES.md,
  },
  logoutButton: {
    marginVertical: SIZES.lg,
  },
});

export default ProfileScreen; 