import React from 'react';

interface BannerWatermarksProps {
  showBrandWatermark?: boolean; // Preview only watermark
  showMobileWatermark?: boolean; // Permanent watermark
  // Face center positions as percentages (0-100)
  achieverFaceX?: number; // Default: 25% from left (achiever photo area)
  achieverFaceY?: number; // Default: 45% from top
  userFaceX?: number; // Default: 75% from left (user photo area)
  userFaceY?: number; // Default: 45% from top
}

/**
 * Banner Watermarks Component
 * 
 * Two layers:
 * 1. Brand Watermark (Preview Only) - "Re Business" vertical over achiever & user face centers
 * 2. Mobile Watermark (Permanent) - Promotional call number on left edge
 */
const BannerWatermarks: React.FC<BannerWatermarksProps> = ({
  showBrandWatermark = true,
  showMobileWatermark = true,
  achieverFaceX = 25,
  achieverFaceY = 50,
  userFaceX = 75,
  userFaceY = 50,
}) => {
  // Watermark text style - 120% larger, bold, 20% opacity
  const watermarkTextStyle: React.CSSProperties = {
    fontSize: '17px', // 120% of 14px
    fontWeight: 700,
    fontFamily: 'Poppins, Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.20)', // 20% opacity (middle of 18-22%)
    letterSpacing: '4px',
    textTransform: 'uppercase',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  // Background strip style - translucent grey
  const stripStyle: React.CSSProperties = {
    background: 'rgba(128, 128, 128, 0.08)',
    padding: '8px 4px',
    borderRadius: '2px',
  };

  return (
    <>
      {/* PREVIEW-ONLY: Brand Watermark - Vertical "Re Business" over face centers */}
      {showBrandWatermark && (
        <div
          id="brand-watermark-preview"
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {/* Watermark over ACHIEVER's face center */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: `${achieverFaceX}%`,
              top: '0',
              bottom: '0',
              transform: 'translateX(-50%)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            <div style={stripStyle}>
              <span style={watermarkTextStyle}>
                Re Business
              </span>
            </div>
          </div>

          {/* Watermark over USER's face center */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: `${userFaceX}%`,
              top: '0',
              bottom: '0',
              transform: 'translateX(-50%)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            <div style={stripStyle}>
              <span style={watermarkTextStyle}>
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
