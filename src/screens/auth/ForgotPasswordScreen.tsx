import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SIZES, ROUTES, VALIDATION } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';

type FormData = {
  email: string;
};

const ForgotPasswordScreen: React.FC = () => {
  const { forgotPassword } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await forgotPassword(data.email);
      if (error) {
        Alert.alert('Password Reset Failed', error.message);
      } else {
        setSubmitted(true);
      }
    } catch (error: any) {
      Alert.alert('Password Reset Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password
        </Text>

        {submitted ? (
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
              style={styles.backToLoginButton}
            />
          </View>
        ) : (
          <>
            <Controller
              control={control}
              rules={{
                required: VALIDATION.REQUIRED,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: VALIDATION.EMAIL,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  touched={value !== ''}
                />
              )}
              name="email"
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.resetButton}
            />
          </>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: SIZES.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.lg,
  },
  resetButton: {
    marginTop: SIZES.md,
  },
  successContainer: {
    alignItems: 'center',
    padding: SIZES.md,
    marginTop: SIZES.lg,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: SIZES.md,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  backToLoginButton: {
    marginTop: SIZES.lg,
  },
});

export default ForgotPasswordScreen; 