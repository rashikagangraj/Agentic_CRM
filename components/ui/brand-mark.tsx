import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  variant?: 'full' | 'icon';
  className?: string;
  showText?: boolean;
  textClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BrandMark({
  variant = 'full',
  className,
  showText = false,
  textClassName,
  size = 'md',
}: BrandMarkProps) {
  const sizeMap = {
    sm: { height: 24, iconSize: 'h-6 w-auto' },
    md: { height: 32, iconSize: 'h-8 w-auto' },
    lg: { height: 40, iconSize: 'h-10 w-auto' },
    xl: { height: 48, iconSize: 'h-12 w-auto' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return (
      <div className={cn("relative flex items-center justify-center shrink-0", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt="aiKart Mark"
          className={cn("object-contain rounded-md transition-transform duration-200 hover:scale-105", currentSize.iconSize)}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-full.png"
        alt="aiKart Logo"
        className={cn("object-contain max-h-9 w-auto transition-transform duration-200 hover:scale-102", currentSize.iconSize)}
      />
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-l border-border/80 pl-2">
            CRM
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandMark;
