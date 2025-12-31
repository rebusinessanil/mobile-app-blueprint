import React from 'react';

interface PremiumGoldAmountProps {
  amount: number | string;
  fontSize?: string;
  showRupeeSymbol?: boolean;
  showSuffix?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Ultra-premium royal 3D metallic gold price text component
 * Features: Indian rupee symbol, gold-to-bronze gradient, embossed/beveled finish
 */
export const PremiumGoldAmount: React.FC<PremiumGoldAmountProps> = ({
  amount,
  fontSize = '62px',
  showRupeeSymbol = true,
  showSuffix = true,
  className = '',
  style = {}
}) => {
  // Format amount with Indian numbering system
  const formattedAmount = typeof amount === 'number' 
    ? amount.toLocaleString('en-IN')
    : Number(amount).toLocaleString('en-IN');

  return (
    <span
      className={`premium-gold-amount ${className}`}
      style={{
        fontSize,
        fontFamily: "'Times New Roman', 'Georgia', serif",
        fontWeight: 900,
        letterSpacing: '3px',
        lineHeight: 1,
        display: 'inline-block',
        // Rich gold-to-bronze gradient
        background: 'linear-gradient(180deg, #FFE5A0 0%, #FFD700 15%, #DAA520 35%, #B8860B 55%, #CD853F 75%, #8B7355 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        // Embossed effect via text shadows
        textShadow: `
          0 1px 0 rgba(255, 235, 180, 0.9),
          0 2px 0 rgba(218, 165, 32, 0.8),
          0 3px 0 rgba(184, 134, 11, 0.7),
          0 4px 0 rgba(139, 115, 85, 0.6),
          0 5px 4px rgba(0, 0, 0, 0.5),
          0 6px 8px rgba(0, 0, 0, 0.4),
          0 8px 16px rgba(0, 0, 0, 0.3),
          0 0 20px rgba(255, 215, 0, 0.3),
          0 0 40px rgba(255, 193, 7, 0.2)
        `,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
        ...style
      }}
    >
      {showRupeeSymbol && '₹'}
      {formattedAmount}
      {showSuffix && '/-'}
    </span>
  );
};

/**
 * Inline style version for canvas/html2canvas compatibility
 * Use this in banner preview for proper export
 */
export const getPremiumGoldAmountStyle = (fontSize: string = '62px'): React.CSSProperties => ({
  fontSize,
  fontFamily: "'Times New Roman', 'Georgia', serif",
  fontWeight: 900,
  letterSpacing: '3px',
  lineHeight: 1,
  display: 'inline-block',
  color: '#DAA520',
  background: 'linear-gradient(180deg, #FFE5A0 0%, #FFD700 15%, #DAA520 35%, #B8860B 55%, #CD853F 75%, #8B7355 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textShadow: `
    0 1px 0 rgba(255, 235, 180, 0.9),
    0 2px 0 rgba(218, 165, 32, 0.8),
    0 3px 0 rgba(184, 134, 11, 0.7),
    0 4px 0 rgba(139, 115, 85, 0.6),
    0 5px 4px rgba(0, 0, 0, 0.5),
    0 6px 8px rgba(0, 0, 0, 0.4),
    0 8px 16px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 215, 0, 0.3),
    0 0 40px rgba(255, 193, 7, 0.2)
  `,
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
  margin: 0,
  textAlign: 'left' as const
});

/**
 * Format amount with rupee symbol and suffix
 */
export const formatPremiumAmount = (amount: number | string, showRupee = true, showSuffix = true): string => {
  const formattedAmount = typeof amount === 'number' 
    ? amount.toLocaleString('en-IN')
    : Number(amount).toLocaleString('en-IN');
  
  return `${showRupee ? '₹' : ''}${formattedAmount}${showSuffix ? '/-' : ''}`;
};

export default PremiumGoldAmount;
