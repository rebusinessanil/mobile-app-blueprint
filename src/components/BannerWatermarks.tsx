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
  // Generate repeating watermark instances for full vertical coverage
  const watermarkCount = 10;
  const watermarks = Array.from({ length: watermarkCount }, (_, i) => i);

  // Watermark text style
  const watermarkTextStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    fontFamily: 'Poppins, Arial, sans-serif',
    color: 'rgba(80, 80, 80, 0.85)',
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
    width: '28px',
    backgroundColor: 'rgba(180, 180, 180, 0.70)',
    borderLeft: '1px solid rgba(120, 120, 120, 0.4)',
    borderRight: '1px solid rgba(120, 120, 120, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0',
  };

  return (
    <>
      {/* PREVIEW-ONLY: Brand Watermark - Repeating vertical "© Re Business" on edges */}
      {showBrandWatermark && (
        <div
          id="brand-watermark-preview"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {/* LEFT EDGE - Two vertical watermark strips */}
          {/* First left strip - at 8% */}
          <div style={{ ...stripStyle, left: '8%' }}>
            {watermarks.map((i) => (
              <span
                key={`left1-${i}`}
                style={{
                  ...watermarkTextStyle,
                  transform: 'rotate(180deg)',
                }}
              >
                © Re Business
              </span>
            ))}
          </div>
          
          {/* Second left strip - at 15% */}
          <div style={{ ...stripStyle, left: '15%' }}>
            {watermarks.map((i) => (
              <span
                key={`left2-${i}`}
                style={{
                  ...watermarkTextStyle,
                  transform: 'rotate(180deg)',
                }}
              >
                © Re Business
              </span>
            ))}
          </div>

          {/* RIGHT EDGE - Two vertical watermark strips */}
          {/* First right strip - at 85% */}
          <div style={{ ...stripStyle, right: '15%', left: 'auto' }}>
            {watermarks.map((i) => (
              <span
                key={`right1-${i}`}
                style={watermarkTextStyle}
              >
                © Re Business
              </span>
            ))}
          </div>
          
          {/* Second right strip - at 92% */}
          <div style={{ ...stripStyle, right: '8%', left: 'auto' }}>
            {watermarks.map((i) => (
              <span
                key={`right2-${i}`}
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
