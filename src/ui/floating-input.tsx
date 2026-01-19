import * as React from "react"
import { cn } from "./utils"

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
  brandColor?: string
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, type, label, icon, value, rightElement, brandColor = '#2563eb', ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = value !== undefined && value !== null && value !== '';
    const shouldFloat = isFocused || hasValue;

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
          <input
            type={type}
            className={cn(
              "w-full bg-transparent text-base outline-none z-10",
              "text-gray-900",
              "[appearance:textfield]",
              "[&::-webkit-outer-spin-button]:appearance-none",
              "[&::-webkit-inner-spin-button]:appearance-none",
              className
            )}
            style={{
              border: 'none',
              boxShadow: 'none !important',
              outline: 'none !important',
              height: '24px',
              lineHeight: '24px',
              paddingRight: rightElement ? '100px' : '0'
            }}
            ref={ref}
            placeholder=" "
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 top-[14px] bottom-[14px] flex items-center z-20">
              {rightElement}
            </div>
          )}
          <label
            className="absolute text-sm pointer-events-none transition-all duration-200 origin-left"
            style={{
              top: shouldFloat ? '-0.625rem' : '50%',
              left: icon ? '2.25rem' : '0.625rem',
              transform: shouldFloat ? 'translateY(0) scale(0.75)' : 'translateY(-50%) scale(1)',
              paddingLeft: shouldFloat ? '0.25rem' : '0',
              paddingRight: shouldFloat ? '0.25rem' : '0',
              zIndex: shouldFloat ? 20 : 10,
              backgroundColor: shouldFloat ? 'white' : 'transparent'
            }}
          >
            <span
              style={{
                color: shouldFloat ? brandColor : '#9ca3af'
              }}
            >
              {label}
            </span>
          </label>
        </div>
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
