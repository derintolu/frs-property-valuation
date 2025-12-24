"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";

export interface FloatingSelectProps {
  label: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  placeholder?: string;
  brandColor?: string;
}

export function FloatingSelect({
  label,
  value,
  onValueChange,
  children,
  icon,
  placeholder,
  brandColor = '#2563eb',
}: FloatingSelectProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const shouldFloat = hasValue;

  return (
    <div className="relative mb-4">
      <div
        className="flex items-center gap-2 rounded-md px-3 py-3 transition-all duration-200 relative bg-white"
        style={{
          border: '2px solid transparent',
          borderColor: shouldFloat ? 'transparent' : '#d1d5db',
          backgroundImage: shouldFloat
            ? `linear-gradient(white, white), linear-gradient(135deg, ${brandColor} 0%, ${brandColor} 100%)`
            : 'none',
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box'
        }}
      >
        {icon && (
          <span
            className="flex-shrink-0 transition-all duration-200"
            style={{
              color: shouldFloat ? brandColor : '#9ca3af'
            }}
          >
            {icon}
          </span>
        )}

        <SelectPrimitive.Root
          value={value || ''}
          onValueChange={onValueChange}
          onOpenChange={(open) => setIsOpen(open)}
        >
          <SelectPrimitive.Trigger
            className={cn(
              "w-full bg-transparent text-base outline-none z-10 flex items-center justify-between",
              hasValue ? "text-gray-900" : "text-gray-400"
            )}
            style={{
              border: 'none',
              boxShadow: 'none !important',
              outline: 'none !important',
              height: '24px',
              lineHeight: '24px'
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <SelectPrimitive.Value placeholder={placeholder || label} />
            <SelectPrimitive.Icon asChild>
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                "bg-white text-gray-900 relative z-50 max-h-96 overflow-hidden rounded-md border shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              )}
              position="popper"
              style={{
                width: 'var(--radix-select-trigger-width)'
              }}
            >
              <SelectPrimitive.Viewport className="p-1">
                {children}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {shouldFloat && (
          <label
            className="absolute text-sm pointer-events-none transition-all duration-200 origin-left"
            style={{
              top: '-0.625rem',
              left: icon ? '2.25rem' : '0.625rem',
              transform: 'translateY(0) scale(0.75)',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              zIndex: 20,
              backgroundColor: 'white'
            }}
          >
            <span
              style={{
                color: brandColor
              }}
            >
              {label}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

export function FloatingSelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer items-center rounded-sm py-2 px-3 text-sm outline-none",
        "hover:bg-gray-100 focus:bg-gray-100",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
