import React from 'react'

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }> = ({ children, className, ...props }) => {
  return (
    <button {...props} className={"px-3 py-2 rounded bg-[#402e27] text-[#f8f7f2] " + (className || '')}>
      {children}
    </button>
  )
}

export default Button
