interface BrandLogoProps {
  symbolSize?: number
  showText?: boolean
  className?: string
}

export function BrandLogo({ symbolSize = 34, showText = true, className }: BrandLogoProps) {
  return (
    <div className={`d-flex align-items-center gap-2 ${className ?? ''}`}>
      <BrandSymbol size={symbolSize} />
      {showText && (
        <span className="fw-bold" style={{ fontSize: '1rem', lineHeight: 1, fontFamily: "'Manrope', 'Inter', system-ui" }}>
          <span style={{ color: '#4FB6AC' }}>Baby's</span>{' '}
          <span style={{ color: '#F28C82' }}>Plan</span>
        </span>
      )}
    </div>
  )
}

export function BrandSymbol({ size = 34 }: { size?: number }) {
  return (
    <img
      src="/icons/logo-icon.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ flexShrink: 0, objectFit: 'contain' }}
    />
  )
}
