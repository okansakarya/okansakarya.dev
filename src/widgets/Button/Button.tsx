import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Button.css'

type ButtonVariant = 'primary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm'

type BaseProps = {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  active?: boolean
  block?: boolean
  className?: string
  'aria-label'?: string
}

type RouterLinkProps = BaseProps & { to: string; onClick?: () => void }
type ExternalLinkProps = BaseProps & { href: string; download?: boolean }
type NativeButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    loading?: boolean
  }

export type ButtonProps = RouterLinkProps | ExternalLinkProps | NativeButtonProps

function buildClassName({ variant = 'primary', size = 'md', active, block, className }: BaseProps) {
  return [
    'button',
    `button--${variant}`,
    `button--${size}`,
    active && 'button--active',
    block && 'button--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

function Content({ icon, children }: Pick<BaseProps, 'icon' | 'children'>) {
  return (
    <>
      {icon && (
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      )}
      {children && <span className="button__label">{children}</span>}
    </>
  )
}

export function Button(props: ButtonProps) {
  const className = buildClassName(props)
  const ariaLabel = props['aria-label']

  if ('to' in props) {
    return (
      <Link
        to={props.to}
        className={className}
        aria-label={ariaLabel}
        aria-current={props.active ? 'page' : undefined}
        onClick={props.onClick}
      >
        <Content icon={props.icon}>{props.children}</Content>
      </Link>
    )
  }

  if ('href' in props) {
    const isExternal = /^https?:\/\//.test(props.href)
    return (
      <a
        href={props.href}
        className={className}
        aria-label={ariaLabel}
        download={props.download || undefined}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        <Content icon={props.icon}>{props.children}</Content>
      </a>
    )
  }

  const {
    variant: _variant,
    size: _size,
    icon,
    active: _active,
    block: _block,
    className: _className,
    loading,
    children,
    type = 'button',
    disabled,
    ...rest
  } = props

  return (
    <button
      {...rest}
      type={type}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <Content icon={loading ? 'progress_activity' : icon}>{children}</Content>
    </button>
  )
}
