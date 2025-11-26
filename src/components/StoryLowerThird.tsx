interface StoryLowerThirdProps {
  variant: 'yellow' | 'blue' | 'teal';
  className?: string;
}

export default function StoryLowerThird({ variant, className = "" }: StoryLowerThirdProps) {
  // Define colors for each variant based on reference image
  const variantColors = {
    teal: {
      top: '#06D6A0',
      bottom: '#06D6A0', 
      dark: 'linear-gradient(90deg, #1a1a1a 0%, #0a0a0a 100%)'
    },
    blue: {
      top: '#0096C7',
      bottom: '#48CAE4',
      dark: 'linear-gradient(90deg, #1a1a1a 0%, #0a0a0a 100%)'
    },
    yellow: {
      top: '#FFB703',
      bottom: '#FFD60A',
      dark: 'linear-gradient(90deg, #1a1a1a 0%, #0a0a0a 100%)'
    }
  };

  const colors = variantColors[variant];

  return (
    <div className={`absolute bottom-0 left-0 w-full z-5 ${className}`} style={{ pointerEvents: 'none' }}>
      {/* Three bars with angular diagonal cuts - STRICTLY mid-to-bottom positioning */}
      
      {/* Top accent bar */}
      <div 
        className="absolute"
        style={{
          bottom: '270px',
          left: '27px',
          width: '486px',
          height: '8px',
          background: colors.top,
          clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)'
        }}
      />
      
      {/* Wide dark middle bar */}
      <div 
        className="absolute"
        style={{
          bottom: '216px',
          left: '108px',
          width: '1080px',
          height: '54px',
          background: colors.dark,
          clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 0 100%)'
        }}
      />
      
      {/* Bottom accent bar with contact info area */}
      <div 
        className="absolute"
        style={{
          bottom: '162px',
          left: '0',
          width: '891px',
          height: '27px',
          background: colors.bottom,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
        }}
      />
    </div>
  );
}
