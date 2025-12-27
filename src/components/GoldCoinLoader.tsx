import React from 'react';

interface GoldCoinLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showMessage?: boolean;
  className?: string;
}

const GoldCoinLoader: React.FC<GoldCoinLoaderProps> = ({
  size = 'md',
  message,
  showMessage = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const glowSizes = {
    sm: 'shadow-[0_0_15px_hsl(45_100%_60%/0.4)]',
    md: 'shadow-[0_0_25px_hsl(45_100%_60%/0.5)]',
    lg: 'shadow-[0_0_35px_hsl(45_100%_60%/0.5)]',
    xl: 'shadow-[0_0_50px_hsl(45_100%_60%/0.6)]'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* 3D Gold Coin Container */}
      <div className="coin-perspective">
        <div className={`coin-3d ${sizeClasses[size]} ${glowSizes[size]}`}>
          {/* Coin Front Face */}
          <div className="coin-face coin-front">
            <div className="coin-inner">
              <div className="coin-shine" />
              <span className="coin-symbol">₹</span>
            </div>
          </div>
          {/* Coin Back Face */}
          <div className="coin-face coin-back">
            <div className="coin-inner">
              <div className="coin-shine" />
              <span className="coin-symbol">★</span>
            </div>
          </div>
          {/* Coin Edge (3D Depth) */}
          <div className="coin-edge" />
        </div>
      </div>

      {/* Shimmer Loading Text */}
      {showMessage && (
        <div className="shimmer-loading-text text-sm font-medium">
          {message || 'Loading...'}
        </div>
      )}
    </div>
  );
};

export default GoldCoinLoader;
