import React from 'react';
import type { ColorValue } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface IconProps {
  size?: number;
  color?: ColorValue;
}

export const SearchIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => <MaterialIcons name="search" size={size} color={color} />;

export const EmailIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => <MaterialIcons name="email" size={size} color={color} />;

export const ShareIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => <MaterialIcons name="share" size={size} color={color} />;

export const MenuIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => <MaterialIcons name="more-vert" size={size} color={color} />;

export const BackIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <MaterialIcons name="arrow-back" size={size} color={color} />;

export const TimeIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#000',
}) => <MaterialIcons name="access-time" size={size} color={color} />;

export const PhoneIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#000',
}) => <MaterialIcons name="stay-current-portrait" size={size} color={color} />;

export const EditIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#000',
}) => <MaterialIcons name="edit" size={size} color={color} />;

export const DeleteIcon: React.FC<IconProps> = ({
  size = 16,
  color = '#000',
}) => <MaterialIcons name="delete" size={size} color={color} />;

export const CopyIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => <MaterialIcons name="content-copy" size={size} color={color} />;

export const CloseIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => <MaterialIcons name="close" size={size} color={color} />;
