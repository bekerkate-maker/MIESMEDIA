import React from 'react'

export const Card: React.FC<any> = ({ children, className }) => (
  <div className={"p-4 bg-[#f8f7f2] border rounded shadow " + (className || '')}>{children}</div>
)

export const CardHeader: React.FC<any> = ({ children }) => <div className="mb-2 font-semibold">{children}</div>
export const CardTitle: React.FC<any> = ({ children }) => <div className="text-lg">{children}</div>
export const CardContent: React.FC<any> = ({ children }) => <div className="text-sm">{children}</div>

export default Card
