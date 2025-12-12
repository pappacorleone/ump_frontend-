import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'live'
  children: ReactNode
  className?: string
}

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-light text-green-accent',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-accent',
    live: 'bg-red-500 text-white',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 
        text-xs font-medium uppercase tracking-wider
        rounded-sm
        ${variants[variant]}
        ${className}
      `}
    >
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      )}
      {children}
    </span>
  )
}

