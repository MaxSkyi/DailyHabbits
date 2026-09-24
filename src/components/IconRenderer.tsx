import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

export const AVAILABLE_ICONS = [
  'Dumbbell',
  'BookOpen',
  'Droplets',
  'Brain',
  'Footprints',
  'Flame',
  'Sparkles',
  'Heart',
  'Coffee',
  'Target',
  'Apple',
  'Bike',
  'Moon',
  'Sun',
  'Music',
  'Code',
  'PenTool',
  'Smile',
  'Shield',
  'Trophy',
  'Star',
  'Zap',
  'Activity',
  'Bed',
  'CheckCircle2',
  'Compass',
  'FlameKindling',
  'GlassWater',
  'Leaf',
  'Scale',
];

export const PRESET_COLORS = [
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Lime', hex: '#84CC16' },
];

interface IconRendererProps extends LucideProps {
  name: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, ...props }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.Flame;
  return <IconComponent {...props} />;
};
