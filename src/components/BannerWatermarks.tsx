import React from 'react';

interface BannerWatermarksProps {
  showBrandWatermark?: boolean; // Preview only watermark
  showMobileWatermark?: boolean; // Permanent watermark
}

/**
 * Banner Watermarks Component
 * 
 * Two layers:
 * 1. Brand Watermark (Preview Only) - "ReBusiness" repeated diagonally
 * 2. Mobile Watermark (Permanent) - Promotional call number on left edge
 */
const BannerWatermarks: React.FC<BannerWatermarksProps> = ({
  showBrandWatermark = true,
  showMobileWatermark = true,
}) => {
  return (
    <>
      {/* PREVIEW-ONLY: Brand Watermark - Diagonal repeated "ReBusiness" */}
      {showBrandWatermark && (
        <div
          id="brand-watermark-preview"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            zIndex: 100,
          }}
        >
          {/* Diagonal pattern container */}
          <div
            className="absolute"
            style={{
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
              transform: 'rotate(-30deg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '120px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Generate repeated watermark rows */}
            {Array.from({ length: 12 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex gap-16 whitespace-nowrap"
                style={{
                  marginLeft: rowIndex % 2 === 0 ? '0' : '150px',
                }}
              >
                {Array.from({ length: 8 }).map((_, colIndex) => (
                  <span
                    key={colIndex}
                    style={{
                      fontSize: '72px',
                      fontWeight: 800,
                      fontFamily: 'Poppins, sans-serif',
                      color: 'rgba(255, 255, 255, 0.12)',
                      letterSpacing: '4px',
                      textTransform: 'uppercase',
                      userSelect: 'none',
                      textShadow: '0 0 20px rgba(0,0,0,0.1)',
                    }}
                  >
                    ReBusiness
                  </span>
                ))}
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
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255, 255, 255, 0.10)',
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
