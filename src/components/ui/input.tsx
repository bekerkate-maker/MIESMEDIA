import React from 'react'

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return <input {...props} className={(props.className || '') + ' px-2 py-2 border rounded'} />
}

export default Input
