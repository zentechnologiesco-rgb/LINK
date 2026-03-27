import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

const logoDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public', 'logo-trans.png')
).toString('base64')}`

export function createPwaIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          overflow: 'hidden',
        }}
      >
        <img
          src={logoDataUrl}
          alt="LINK logo"
          style={{
            width: '470%',
            height: '470%',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
