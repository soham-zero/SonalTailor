import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-boutique-roseDark disabled:pointer-events-none disabled:opacity-50 select-none",
          {
            'bg-boutique-charcoal text-white hover:bg-boutique-roseDark shadow-sm hover:shadow-md active:scale-[0.98]': variant === 'primary',
            'bg-boutique-roseLight text-boutique-charcoal hover:bg-boutique-roseDark hover:text-white shadow-sm': variant === 'secondary',
            'border-2 border-boutique-border bg-white/60 hover:bg-boutique-creamDark hover:border-boutique-rose text-boutique-charcoal': variant === 'outline',
            'hover:bg-boutique-creamDark text-boutique-charcoalLight hover:text-boutique-charcoal': variant === 'ghost',
            'bg-boutique-ruby text-white hover:bg-red-700 shadow-sm active:scale-[0.98]': variant === 'danger',
            'bg-boutique-emerald text-white hover:bg-emerald-600 shadow-sm active:scale-[0.98]': variant === 'success',
            'bg-boutique-amber text-white hover:bg-amber-600 shadow-sm active:scale-[0.98]': variant === 'warning',
            'bg-boutique-teal text-white hover:bg-teal-700 shadow-sm active:scale-[0.98]': variant === 'info',
            'h-7 px-3 text-xs rounded-md': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
