import { Theme } from '../types';

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#4B89DC',
    background: '#F7F9FC',
    card: '#FFFFFF',
    text: '#333333',
    border: '#E1E8ED',
    notification: '#FF5A5F',
    success: '#50C878',
    warning: '#FFAB40',
    error: '#FF5A5F',
    info: '#5BC0DE',
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#5D9CEC',
    background: '#1A1D21',
    card: '#2A2E32',
    text: '#F7F9FC',
    border: '#3A3E42',
    notification: '#FF6B6B',
    success: '#5BE892',
    warning: '#FFB74D',
    error: '#FF6B6B',
    info: '#66D3FA',
  },
}; 