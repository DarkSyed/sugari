import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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
  password: string;
  confirmPassword: string;
};

const RegisterScreen: React.FC = () => {
  const { register } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { error } = await register(data.email, data.password);
      if (error) {
        Alert.alert('Registration Failed', error.message);
      } else {
        // Registration successful, user will be automatically logged in
        Alert.alert(
          'Registration Successful',
          'Your account has been created successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start managing your diabetes</Text>

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

        <Controller
          control={control}
          rules={{
            required: VALIDATION.REQUIRED,
            minLength: {
              value: 8,
              message: VALIDATION.PASSWORD_MIN,
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              touched={value !== ''}
            />
          )}
          name="password"
        />

        <Controller
          control={control}
          rules={{
            required: VALIDATION.REQUIRED,
            validate: value =>
              value === watchPassword || VALIDATION.PASSWORD_MATCH,
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              touched={value !== ''}
            />
          )}
          name="confirmPassword"
        />

        <Text style={styles.termsText}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        <Button
          title="Sign Up"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.registerButton}
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
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
  termsText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginVertical: SIZES.md,
    textAlign: 'center',
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  registerButton: {
    marginBottom: SIZES.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.md,
  },
  loginText: {
    color: COLORS.lightText,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 