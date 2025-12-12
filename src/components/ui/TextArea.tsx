import type { TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export default function TextArea({
  label,
  hint,
  className = '',
  id,
  ...props
}: TextAreaProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium uppercase tracking-widest text-gray-500 mb-1"
        >
          {label}
        </label>
      )}
      {hint && (
        <p className="text-sm text-gray-500 mb-2">{hint}</p>
      )}
      <textarea
        id={id}
        className={`
          w-full px-4 py-3 
          border border-gray-200 rounded-sm
          text-gray-800 placeholder-gray-400
          focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200
          transition-colors duration-200
          resize-y min-h-[120px]
          ${className}
        `}
        {...props}
      />
    </div>
  )
}

