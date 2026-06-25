interface BrandLogoProps {
  symbolSize?: number
  showText?: boolean
  className?: string
}

// SVG symbol recreated from the official Baby's Plan logo:
// - Left adult (teal) + right adult (coral) bodies form a heart
// - Child figure protected at the center
// - Journey path with gradient at the bottom
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 490"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="bp-jg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4FB6AC" stopOpacity="1" />
          <stop offset="75%" stopColor="#4FB6AC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4FB6AC" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Left adult — teal: body forms the left lobe of the heart */}
      <circle cx="148" cy="68" r="46" fill="#4FB6AC" />
      <path
        d="M 162 112 C 220 124 268 160 262 202 C 256 236 214 260 176 282 C 122 314 48 358 52 420 C 54 460 112 482 192 484"
        stroke="#4FB6AC" strokeWidth="60" strokeLinecap="round" fill="none"
      />

      {/* Right adult — coral: body forms the right lobe of the heart */}
      <circle cx="296" cy="90" r="38" fill="#F28C82" />
      <path
        d="M 268 126 C 244 154 254 196 278 220 C 306 250 364 296 364 364 C 364 420 326 466 250 484"
        stroke="#F28C82" strokeWidth="54" strokeLinecap="round" fill="none"
      />

      {/* Child — teal: protected at the center of the heart */}
      <circle cx="222" cy="262" r="28" fill="#4FB6AC" />
      <path
        d="M 182 312 C 196 296 250 296 264 312"
        stroke="#4FB6AC" strokeWidth="21" strokeLinecap="round" fill="none"
      />

      {/* Journey path — gradient from solid to transparent, representing the continuing journey */}
      <path
        d="M 82 482 C 108 502 164 488 222 500 C 276 512 346 492 416 470"
        stroke="url(#bp-jg)" strokeWidth="27" strokeLinecap="round" fill="none"
      />
    </svg>
  )
}
