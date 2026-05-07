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
        <div
          style={{
            width: '280%',
            height: '280%',
            backgroundImage: `url(${logoDataUrl})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
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
