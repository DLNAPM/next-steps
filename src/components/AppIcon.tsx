import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AppIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AppIcon({ className = '', size = 'md' }: AppIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36,
    xl: 48
  };

  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 ${sizeClasses[size]} ${className}`}>
      <ShieldCheck size={iconSizes[size]} strokeWidth={2.5} />
    </div>
  );
}
