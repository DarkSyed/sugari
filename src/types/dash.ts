export interface DayData {
  dayLetter: string;
  date: number;
  isSelected: boolean;
  avgGlucose: number;
  isToday: boolean;
}

export interface DashHeaderProps {
  selectedDay: DayData;
  onProfilePress?: () => void;
  onCalendarPress?: () => void;
  onCGMPress?: () => void;
  onNotificationPress?: () => void;
}

export interface DaySelectorProps {
  days: DayData[];
  selectedIndex: number;
  onDaySelect?: (index: number) => void;
}
