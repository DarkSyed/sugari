import { NavigatorScreenParams } from '@react-navigation/native';
import { ROUTES } from '../constants';

// Auth Navigator Param List
export type AuthParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Dashboard Stack Param List
export type DashboardStackParamList = {
  Dashboard: undefined;
  AddGlucose: undefined;
  Profile: undefined;
  AddFood: undefined;
  AddInsulin: undefined;
};

// Tab Navigator Param List
export type TabParamList = {
  Home: NavigatorScreenParams<DashboardStackParamList>;
  GlucoseLog: undefined;
  Analytics: undefined;
  Settings: undefined;
};

// Root Navigator Param List
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

// Declare the navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 