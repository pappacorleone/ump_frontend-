import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({
  label,
  className = '',
  id,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium uppercase tracking-widest text-gray-500 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-4 py-3 
          border border-gray-200 rounded-sm
          text-gray-800 placeholder-gray-400
          focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200
          transition-colors duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  )
}

