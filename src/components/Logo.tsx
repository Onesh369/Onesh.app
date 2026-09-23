type Props = {
  size?: number
  className?: string
}

export function Logo({ size = 28, className }: Props) {
  return (
    <svg
      className={className ? `logo ${className}` : 'logo'}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <rect className="logo-tile" width="64" height="64" rx="16" />
      <path
        className="logo-ring"
        d="M 41.539 47.265 A 18 18 0 1 1 45.377 44.044"
        fill="none"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle className="logo-dot" cx="32" cy="32" r="4.5" />
    </svg>
  )
}
