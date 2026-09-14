import type { ReactNode, SVGProps } from 'react'

function Svg({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const ICONS: Record<string, (className?: string) => ReactNode> = {
  reading: (className) => (
    <Svg className={className}>
      <path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20" />
      <path d="M6.2 3.5H20V20.5H6.2A2.2 2.2 0 0 1 4 18.3V5.7A2.2 2.2 0 0 1 6.2 3.5z" />
      <path d="M8.4 8h8.2M8.4 12h6" />
    </Svg>
  ),
  running: (className) => (
    <Svg className={className}>
      <circle cx="14.5" cy="5" r="2.1" />
      <path d="M11 9.2 8.2 12.4 4.8 13.2" />
      <path d="M11 9.2 13.2 13l5.3 1.4" />
      <path d="M13.1 13 10.2 20.2" />
      <path d="M11 9.2 6.6 20.2" />
      <path d="M9.6 15.6h3.4" />
    </Svg>
  ),
  gym: (className) => (
    <Svg className={className}>
      <path d="M8.5 12h7" />
      <rect x="1.8" y="8" width="3.4" height="8" rx="1" />
      <rect x="18.8" y="8" width="3.4" height="8" rx="1" />
      <rect x="5.2" y="9.4" width="2.4" height="5.2" rx="0.7" />
      <rect x="16.4" y="9.4" width="2.4" height="5.2" rx="0.7" />
    </Svg>
  ),
  pray: (className) => (
    <Svg className={className}>
      <path d="M4 20h16" />
      <path d="M6.5 20V11.5h2.2V20" />
      <path d="M7.6 11.5V8.2" />
      <path d="M8.8 6.6a1.45 1.45 0 1 1-1.7 1.85" />
      <path d="M10 20v-8.2h8.2V20" />
      <path d="M10 11.8c2.4-4.2 5.8-4.2 8.2 0" />
      <path d="M12.6 16.2h3v3.8h-3z" />
    </Svg>
  ),
  meditation: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="5.2" r="2.1" />
      <path d="M9.2 20.2c.4-4.2 1.4-6.6 2.8-6.6s2.4 2.4 2.8 6.6" />
      <path d="M12 10.2c-2.1 1.6-3.8 2-5.8 1.4" />
      <path d="M12 10.2c2.1 1.6 3.8 2 5.8 1.4" />
      <path d="M6.2 16.4c1.8-.6 3.2.2 5.8 2.4 2.6-2.2 4-3 5.8-2.4" />
    </Svg>
  ),
  walking: (className) => (
    <Svg className={className}>
      <circle cx="12.2" cy="4.8" r="2.1" />
      <path d="M12.2 8v5.2" />
      <path d="M12.2 13.2 8.4 20.4" />
      <path d="M12.2 13.2 15.8 20.4" />
      <path d="M12.2 9.6 16.6 12" />
      <path d="M12.2 10.2 8.4 13.2" />
    </Svg>
  ),
  work: (className) => (
    <Svg className={className}>
      <rect x="3.5" y="5.5" width="17" height="11" rx="1.8" />
      <path d="M3 18.2h18" />
      <path d="M10 18.2v1.4h4v-1.4" />
    </Svg>
  ),
  focus: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4" />
    </Svg>
  ),
  farm: (className) => (
    <Svg className={className}>
      <path d="M5 20h14" />
      <path d="M12 20V11" />
      <path d="M12 14.2c-3.2-1.4-5.2-4.4-5.2-7.4 4.4.2 5.2 3.4 5.2 7.4" />
      <path d="M12 12.4c3.2-1.2 5.1-3.8 5.1-6.8-4.3.1-5.1 3.2-5.1 6.8" />
    </Svg>
  ),
  water: (className) => (
    <Svg className={className}>
      <path d="M12 3.4c-2.3 4.4-6.2 7.6-6.2 12a6.2 6.2 0 0 0 12.4 0c0-4.4-3.9-7.6-6.2-12z" />
    </Svg>
  ),
  sleep: (className) => (
    <Svg className={className}>
      <path d="M14 4.4A8 8 0 1 0 20 14.2 6.6 6.6 0 0 1 14 4.4z" />
    </Svg>
  ),
  journal: (className) => (
    <Svg className={className}>
      <path d="M6 4.5h10.2A2.3 2.3 0 0 1 18.5 6.8V20H8.2A2.2 2.2 0 0 0 6 22.2V4.5z" />
      <path d="M6 4.5A2.2 2.2 0 0 0 3.8 6.7V20" />
      <path d="M9.4 9h6.2M9.4 12.5h6.2M9.4 16h4.2" />
    </Svg>
  ),
  eat: (className) => (
    <Svg className={className}>
      <path d="M12 9.2c-4 0-6.8 3-6.8 6.8C5.2 19.6 8.2 22 12 22s6.8-2.4 6.8-6c0-3.8-2.8-6.8-6.8-6.8z" />
      <path d="M12 9.2c.4-2.2 1.8-4.4 4.2-5" />
      <path d="M11.4 9.2c-.4-1.8-.2-3.6.6-5" />
    </Svg>
  ),
  yoga: (className) => (
    <Svg className={className}>
      <circle cx="12" cy="8.2" r="2.05" />
      <path d="M7.4 4.4 12 8.4 16.6 4.4" />
      <path d="M12 10.4v4" />
      <path d="M8.4 20.6 12 14.4l3.6 6.2" />
    </Svg>
  ),
  bike: (className) => (
    <Svg className={className}>
      <circle cx="6.2" cy="16.2" r="3.3" />
      <circle cx="17.8" cy="16.2" r="3.3" />
      <path d="M6.2 16.2 10.6 8.4h4.2" />
      <path d="M10.6 8.4 12.4 16" />
      <path d="M14.8 8.4h2.4l1.8 7.8" />
      <path d="M10.2 12.4h5.2" />
      <circle cx="13.2" cy="7" r="1.05" />
    </Svg>
  ),
  sunrise: (className) => (
    <Svg className={className}>
      <path d="M4 18.5h16" />
      <path d="M8.2 18.5a3.8 3.8 0 0 1 7.6 0" />
      <path d="M12 6.2v2.4M5.8 10.4l1.7 1.2M18.2 10.4l-1.7 1.2" />
    </Svg>
  ),
  study: (className) => (
    <Svg className={className}>
      <path d="M3.4 10.4 12 6l8.6 4.4L12 14.8z" />
      <path d="M7.2 12.6v3.8c2.4 1.6 7.2 1.6 9.6 0v-3.8" />
      <path d="M20.6 10.4v5.4" />
    </Svg>
  ),
  music: (className) => (
    <Svg className={className}>
      <path d="M9 18.4V6.2l10-2v12.2" />
      <circle cx="7" cy="18.4" r="2.4" />
      <circle cx="17" cy="16.4" r="2.4" />
    </Svg>
  ),
}

export function HabitMark({ id, className }: { id: string; className?: string }) {
  const render = ICONS[id]
  if (!render) return <span className={className}>{id}</span>
  return <>{render(className)}</>
}
