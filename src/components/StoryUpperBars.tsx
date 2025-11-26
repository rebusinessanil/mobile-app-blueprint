interface StoryUpperBarsProps {
  className?: string;
}

export default function StoryUpperBars({ className = "" }: StoryUpperBarsProps) {
  return (
    <div className={`absolute top-0 left-0 w-full z-10 ${className}`}>
      {/* Three dark-theme upper bars with angular cuts */}
      
      {/* Top bar - Thin cyan/teal accent */}
      <div 
        className="absolute"
        style={{
          top: '40px',
          left: '78px',
          width: '486px',
          height: '8px',
          background: '#06D6A0',
          clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)'
        }}
      />
      
      {/* Middle bar - Wide dark/black main bar */}
      <div 
        className="absolute"
        style={{
          top: '65px',
          left: '160px',
          width: '810px',
          height: '54px',
          background: 'linear-gradient(90deg, #1a1a1a 0%, #0a0a0a 100%)',
          clipPath: 'polygon(5% 0, 100% 0, 100% 100%, 0 100%)'
        }}
      />
      
      {/* Bottom bar - Medium cyan/teal accent */}
      <div 
        className="absolute"
        style={{
          top: '135px',
          left: '0',
          width: '890px',
          height: '27px',
          background: '#06D6A0',
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
        }}
      />
    </div>
  );
}
