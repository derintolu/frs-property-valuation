import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  iconBgColor = 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  iconColor = 'white'
}: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Icon Container */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
        style={{ background: iconBgColor }}
      >
        <Icon className="w-8 h-8" style={{ color: iconColor }} />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900">
        {title}
      </h1>
    </div>
  );
}
