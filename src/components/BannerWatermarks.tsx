import React from 'react';

interface BannerWatermarksProps {
  showBrandWatermark?: boolean; // Preview only watermark
  showMobileWatermark?: boolean; // Permanent watermark
}

/**
 * Banner Watermarks Component
 * 
 * Two layers:
 * 1. Brand Watermark (Preview Only) - "© Re Business" repeating vertical pattern on left & right edges
 * 2. Mobile Watermark (Permanent) - Promotional call number on left edge
 */
const BannerWatermarks: React.FC<BannerWatermarksProps> = ({
  showBrandWatermark = true,
  showMobileWatermark = true,
}) => {
  // 5 repeating watermarks
  const watermarkCount = 5;
  const watermarks = Array.from({ length: watermarkCount }, (_, i) => i);

  // Watermark text style - white color, 20% larger
  const watermarkTextStyle: React.CSSProperties = {
    fontSize: '16px', // 20% larger than 13px
    fontWeight: 700,
    fontFamily: 'Poppins, Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
  };

  // Background strip style
  const stripStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '32px',
    backgroundColor: 'rgba(100, 100, 100, 0.65)',
    borderLeft: '1px solid rgba(80, 80, 80, 0.5)',
    borderRight: '1px solid rgba(80, 80, 80, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '12px 0',
  };

  return (
    <>
      {/* Black border around the banner */}
      {showBrandWatermark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 101,
            border: '3px solid #000000',
          }}
        />
      )}

      {/* PREVIEW-ONLY: Brand Watermark - Single strip on each edge */}
      {showBrandWatermark && (
        <div
          id="brand-watermark-preview"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {/* LEFT EDGE - Single vertical watermark strip */}
          <div style={{ ...stripStyle, left: '12%' }}>
            {watermarks.map((i) => (
              <span
                key={`left-${i}`}
                style={{
                  ...watermarkTextStyle,
                  transform: 'rotate(180deg)',
                }}
              >
                © Re Business
              </span>
            ))}
          </div>

          {/* RIGHT EDGE - Single vertical watermark strip */}
          <div style={{ ...stripStyle, right: '12%', left: 'auto' }}>
            {watermarks.map((i) => (
              <span
                key={`right-${i}`}
                style={watermarkTextStyle}
              >
                © Re Business
              </span>
            ))}
          </div>
        </div>
      )}

      {/* PERMANENT: Mobile Number Watermark - Left Edge Vertical */}
      {showMobileWatermark && (
        <div
          id="mobile-watermark-permanent"
          className="absolute pointer-events-none"
          style={{
            left: '2px',
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            transformOrigin: 'center center',
            zIndex: 99,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255, 255, 255, 0.08)',
              letterSpacing: '1px',
              userSelect: 'none',
            }}
          >
            Promotional Call +91 77349 90035
          </span>
        </div>
      )}
    </>
  );
};

export default BannerWatermarks;
