import React from 'react';

interface BannerWatermarksProps {
  showBrandWatermark?: boolean; // Preview only watermark
  showMobileWatermark?: boolean; // Permanent watermark
}

/**
 * Banner Watermarks Component
 * 
 * Two layers:
 * 1. Brand Watermark (Preview Only) - "Re Business" repeating vertical pattern on left & right edges
 * 2. Mobile Watermark (Permanent) - Promotional call number on left edge
 */
const BannerWatermarks: React.FC<BannerWatermarksProps> = ({
  showBrandWatermark = true,
  showMobileWatermark = true,
}) => {
  // Generate repeating watermark instances for full coverage
  const watermarkCount = 12; // Number of repetitions for full coverage
  const watermarks = Array.from({ length: watermarkCount }, (_, i) => i);

  return (
    <>
      {/* PREVIEW-ONLY: Brand Watermark - Repeating vertical "Re Business" on edges */}
      {showBrandWatermark && (
        <div
          id="brand-watermark-preview"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {/* LEFT EDGE - Repeating vertical watermarks */}
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-between"
            style={{ width: '40px' }}
          >
            {watermarks.map((i) => (
              <div
                key={`left-${i}`}
                className="flex items-center justify-center"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Poppins, Arial, sans-serif',
                    color: 'rgba(255, 255, 255, 0.25)',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 1px rgba(255, 255, 255, 0.1)',
                    padding: '8px 0',
                  }}
                >
                  Re Business
                </span>
              </div>
            ))}
          </div>

          {/* RIGHT EDGE - Repeating vertical watermarks */}
          <div
            className="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-between"
            style={{ width: '40px' }}
          >
            {watermarks.map((i) => (
              <div
                key={`right-${i}`}
                className="flex items-center justify-center"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Poppins, Arial, sans-serif',
                    color: 'rgba(255, 255, 255, 0.25)',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 1px rgba(255, 255, 255, 0.1)',
                    padding: '8px 0',
                  }}
                >
                  Re Business
                </span>
              </div>
            ))}
          </div>

          {/* CENTER COVERAGE - Additional diagonal watermarks for full protection */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255,255,255,0.03) 80px, rgba(255,255,255,0.03) 82px)',
            }}
          >
            <div
              style={{
                transform: 'rotate(-30deg)',
                opacity: 0.12,
              }}
            >
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  fontFamily: 'Poppins, Arial, sans-serif',
                  color: 'white',
                  letterSpacing: '8px',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                Re Business
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT: Mobile Number Watermark - Left Edge Vertical */}
      {showMobileWatermark && (
        <div
          id="mobile-watermark-permanent"
          className="absolute pointer-events-none"
          style={{
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            transformOrigin: 'center center',
            zIndex: 99,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255, 255, 255, 0.08)',
              letterSpacing: '1.5px',
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
