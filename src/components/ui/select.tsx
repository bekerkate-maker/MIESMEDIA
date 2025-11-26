import React from 'react'

export const Select: React.FC<{ value?: string; onValueChange?: (v: string) => void; children?: React.ReactNode } & any> = ({ children, value, onValueChange }) => {
  return (
    <select value={value} onChange={(e) => onValueChange && onValueChange(e.target.value)} className="px-2 py-2 border rounded">
      {children}
    </select>
  )
}

export const SelectTrigger = ({ children }: any) => <div>{children}</div>
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>
export const SelectContent = ({ children }: any) => <div>{children}</div>
export const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>

export default Select
