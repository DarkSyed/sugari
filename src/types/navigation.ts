import { NavigatorScreenParams } from "@react-navigation/native";
import { ROUTES } from ".";
import { CGMBrand } from ".";

export type AuthParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
};

export type DashboardStackParamList = {
  [ROUTES.DASHBOARD]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.ADD_GLUCOSE]: undefined;
  [ROUTES.ADD_FOOD]: undefined;
  [ROUTES.ADD_INSULIN]: undefined;
};

export type CGMStackParamList = {
  [ROUTES.PAIR_CGM]: { brand: CGMBrand };
};

export type TabParamList = {
  [ROUTES.HOME]: NavigatorScreenParams<DashboardStackParamList>;
  [ROUTES.ANALYTICS]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
