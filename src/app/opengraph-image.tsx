import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#e5e7eb',
          fontSize: 64,
          letterSpacing: -1,
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.8, marginBottom: 12 }}>Global Classifieds</div>
        <div>Buy. Sell. Chat. Anywhere.</div>
      </div>
    ),
    size,
  );
}
