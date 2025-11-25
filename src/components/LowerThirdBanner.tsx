interface LowerThirdBannerProps {
  slotNumber: number;
  name: string;
  rank: string;
  contactNumber: string;
  position?: 'left' | 'right';
}

const LowerThirdBanner = ({ slotNumber, name, rank, contactNumber, position = 'left' }: LowerThirdBannerProps) => {
  // Determine variant based on slot number (1-16)
  // Slot 1,4,7,10,13,16 → Variant 1 (Red)
  // Slot 2,5,8,11,14 → Variant 2 (Orange)
  // Slot 3,6,9,12,15 → Variant 3 (Teal)
  const variantIndex = (slotNumber - 1) % 3;
  
  const variants = [
    {
      // Variant 1 - Red
      borderColor: '#e63946',
      accentColor: '#e63946',
      ctaBg: '#e63946'
    },
    {
      // Variant 2 - Orange
      borderColor: '#f77f00',
      accentColor: '#f77f00',
      ctaBg: '#f77f00'
    },
    {
      // Variant 3 - Teal
      borderColor: '#06d6a0',
      accentColor: '#06d6a0',
      ctaBg: '#06d6a0'
    }
  ];

  const variant = variants[variantIndex];
  const isRightAligned = position === 'right';

  return (
    <div 
      style={{
        position: 'relative',
        width: '1050px',
        height: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Main dark banner container with colored border */}
      <svg 
        width="1050" 
        height="120" 
        viewBox="0 0 1050 120" 
        style={{ 
          position: 'absolute',
          top: 0,
          left: isRightAligned ? 'auto' : 0,
          right: isRightAligned ? 0 : 'auto'
        }}
      >
        <defs>
          <filter id={`shadow-${slotNumber}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Outer colored border shape */}
        <path
          d="M 30 0 L 980 0 L 1050 30 L 1050 90 L 980 120 L 30 120 Q 0 120 0 90 L 0 30 Q 0 0 30 0 Z"
          fill="none"
          stroke={variant.borderColor}
          strokeWidth="4"
          filter={`url(#shadow-${slotNumber})`}
        />
        
        {/* Inner dark background */}
        <path
          d="M 32 6 L 978 6 L 1044 32 L 1044 88 L 978 114 L 32 114 Q 6 114 6 88 L 6 32 Q 6 6 32 6 Z"
          fill="#1a2332"
        />
      </svg>

      {/* Text content on left side */}
      <div 
        style={{
          position: 'absolute',
          left: isRightAligned ? 'auto' : '50px',
          right: isRightAligned ? '320px' : 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
          textAlign: isRightAligned ? 'right' : 'left'
        }}
      >
        <div 
          style={{
            fontSize: '42px',
            fontWeight: '700',
            color: '#ffffff',
            lineHeight: '1.2',
            marginBottom: '4px',
            letterSpacing: '0.5px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {name}
        </div>
        <div 
          style={{
            fontSize: '28px',
            fontWeight: '500',
            color: '#e0e0e0',
            letterSpacing: '1px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {rank}
        </div>
      </div>

      {/* Call-to-action box on right side */}
      <div 
        style={{
          position: 'absolute',
          right: isRightAligned ? '60px' : 'auto',
          left: isRightAligned ? 'auto' : '760px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3
        }}
      >
        <svg width="280" height="90" viewBox="0 0 280 90">
          {/* CTA background shape */}
          <path
            d="M 10 0 L 260 0 L 280 20 L 280 70 L 260 90 L 10 90 Q 0 90 0 80 L 0 10 Q 0 0 10 0 Z"
            fill={variant.ctaBg}
          />
        </svg>
        
        {/* CTA text */}
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '100%',
            padding: '0 20px'
          }}
        >
          <div 
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              letterSpacing: '1.5px',
              marginBottom: '4px',
              textTransform: 'uppercase',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            CALL FOR MENTORSHIP
          </div>
          <div 
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '0.5px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            +91 {contactNumber}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowerThirdBanner;
