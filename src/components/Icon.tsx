import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from '../context/ThemeContext';

export type IconFamily = 'material' | 'material-community' | 'ionicons' | 'font-awesome';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  family?: IconFamily;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  family = 'material',
}) => {
  const {theme} = useTheme();
  const iconColor = color || theme.colors.text;

  switch (family) {
    case 'material':
      return <MaterialIcons name={name} size={size} color={iconColor} />;
    case 'material-community':
      return <MaterialCommunityIcons name={name} size={size} color={iconColor} />;
    case 'ionicons':
      return <Ionicons name={name} size={size} color={iconColor} />;
    case 'font-awesome':
      return <FontAwesome name={name} size={size} color={iconColor} />;
    default:
      return <MaterialIcons name={name} size={size} color={iconColor} />;
  }
};

// Common icon mappings for the app
export const IconNames = {
  // Navigation
  identity: 'badge',
  scan: 'qr-code-scanner',
  settings: 'settings',
  
  // Actions
  add: 'add',
  delete: 'delete',
  edit: 'edit',
  close: 'close',
  check: 'check',
  back: 'arrow-back',
  forward: 'arrow-forward',
  refresh: 'refresh',
  share: 'share',
  copy: 'content-copy',
  
  // Status
  verified: 'verified-user',
  unverified: 'shield',
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'check-circle',
  
  // Features
  camera: 'camera-alt',
  flash: 'flash-on',
  flashOff: 'flash-off',
  switchCamera: 'flip-camera-ios',
  
  // Data
  email: 'email',
  phone: 'phone',
  location: 'location-on',
  calendar: 'calendar-today',
  person: 'person',
  
  // UI
  darkMode: 'dark-mode',
  lightMode: 'light-mode',
  menu: 'menu',
  more: 'more-vert',
  search: 'search',
  filter: 'filter-list',
  sort: 'sort',
  
  // Empty states
  emptyIdentity: 'badge',
  emptyQR: 'qr-code',
} as const;