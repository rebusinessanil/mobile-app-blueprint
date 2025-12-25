import React from 'react';

interface BannerWatermarksProps {
  showBrandWatermark?: boolean; // Preview only watermark
  showMobileWatermark?: boolean; // Permanent watermark
}

/**
 * Banner Watermarks Component
 * 
 * Two layers:
 * 1. Brand Watermark (Preview Only) - "Re Business" vertical along left and right edges
 * 2. Mobile Watermark (Permanent) - Promotional call number on left edge
 */
const BannerWatermarks: React.FC<BannerWatermarksProps> = ({
  showBrandWatermark = true,
  showMobileWatermark = true,
}) => {
  // Number of watermark repetitions along each edge
  const repeatCount = 8;

  return (
    <>
      {/* PREVIEW-ONLY: Brand Watermark - Vertical "Re Business" along left and right edges */}
      {showBrandWatermark && (
        <div
          id="brand-watermark-preview"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {/* Left Edge Watermarks */}
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4"
            style={{ width: '40px' }}
          >
            {Array.from({ length: repeatCount }).map((_, index) => (
              <div
                key={`left-${index}`}
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
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 1px rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Re Business
                </span>
              </div>
            ))}
          </div>

          {/* Right Edge Watermarks */}
          <div
            className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-4"
            style={{ width: '40px' }}
          >
            {Array.from({ length: repeatCount }).map((_, index) => (
              <div
                key={`right-${index}`}
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
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 1px rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Re Business
                </span>
              </div>
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
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
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
