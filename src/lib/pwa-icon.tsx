import { ImageResponse } from 'next/og'

export function createPwaIcon(size: number) {
  const accentColor = '#a9ff3c'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
        }}
      >
        <div
          style={{
            width: '78%',
            height: '78%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            borderRadius: '26%',
            background: 'linear-gradient(145deg, #111111 0%, #050505 100%)',
            border: `3px solid ${accentColor}`,
            boxShadow: '0 28px 50px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '11%',
              borderRadius: '20%',
              border: `2px solid ${accentColor}55`,
            }}
          />
          <span
            style={{
              color: accentColor,
              fontSize: Math.round(size * 0.44),
              fontWeight: 900,
              letterSpacing: '-0.08em',
              lineHeight: 1,
              transform: 'translateY(-2%)',
            }}
          >
            L
          </span>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
