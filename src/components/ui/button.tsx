import React from 'react'

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }> = ({ children, className, ...props }) => {
  return (
    <button {...props} className={"px-3 py-2 rounded bg-blue-600 text-white " + (className || '')}>
      {children}
    </button>
  )
}

export default Button
