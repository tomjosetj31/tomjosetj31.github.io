import type { HTMLAttributes, ReactNode } from 'react'

interface MonoLabelProps extends HTMLAttributes<HTMLElement> {
  as?: 'span' | 'div' | 'p'
  children: ReactNode
}

export function MonoLabel({ as: Tag = 'span', className = '', children, ...rest }: MonoLabelProps) {
  return (
    <Tag className={`lbl ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
