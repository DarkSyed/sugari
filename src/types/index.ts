export * from "./dash";
export * from "./navigation";
export * from "./data";

export interface AIInsight {
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  timestamp: string;
}

export interface ChartDataPoint {
  value: number;
  timestamp: string;
  context?: string;
}

export interface GlucoseTrendData {
  label: string;
  data: ChartDataPoint[];
  timeRange: string;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outline";
  style?: any;
  onPress?: () => void;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  icon?: string;
  iconPosition?: "left" | "right";
}

export interface ContainerProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  type: "info" | "warning" | "success";
}

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface Medication {
  id: number;
  name: string;
  type: "pill" | "injection";
  dosage: string;
  frequency: string;
  notes?: string;
  imagePath?: string;
  timestamp: number;
}

export type CGMBrand = "Dexcom" | "Freestyle Libre" | "Medtronic";
