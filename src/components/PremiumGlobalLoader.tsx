import { memo } from 'react';
import { motion } from 'framer-motion';

interface PremiumGlobalLoaderProps {
  message?: string;
  showMessage?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  className?: string;
}

/**
 * PremiumGlobalLoader - The ONLY loader component for the entire app.
 * Features a 3D spinning gold coin with glow effects and shimmer text.
 * Use this everywhere - no other loaders/spinners allowed.
 */
const PremiumGlobalLoader = memo(({
  message = 'Loading...',
  showMessage = true,
  size = 'lg',
  fullScreen = true,
  className = ''
}: PremiumGlobalLoaderProps) => {
  // Size configurations
  const sizeConfig = {
    sm: { coin: 'w-12 h-12', glow: 'inset-[-8px]', emoji: 'text-xl' },
    md: { coin: 'w-16 h-16', glow: 'inset-[-12px]', emoji: 'text-2xl' },
    lg: { coin: 'w-20 h-20', glow: 'inset-[-16px]', emoji: 'text-3xl' },
    xl: { coin: 'w-24 h-24', glow: 'inset-[-20px]', emoji: 'text-4xl' }
  };

  const config = sizeConfig[size];

  const LoaderContent = (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          className={`absolute ${config.glow} rounded-full bg-gradient-to-r from-primary/40 via-yellow-400/40 to-primary/40 blur-xl`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Spinning Coin Container */}
        <motion.div
          className={`${config.coin} relative`}
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="w-full h-full relative"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {/* Coin Front */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-primary to-amber-600 flex items-center justify-center shadow-2xl border-4 border-yellow-400/50"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className={config.emoji}>💰</div>
              {/* Inner ring detail */}
              <div className="absolute inset-2 rounded-full border-2 border-yellow-200/30" />
            </div>

            {/* Coin Back */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 via-primary to-yellow-300 flex items-center justify-center shadow-2xl border-4 border-yellow-400/50"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className={config.emoji}>⭐</div>
              {/* Inner ring detail */}
              <div className="absolute inset-2 rounded-full border-2 border-yellow-200/30" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Loading Text with Shimmer */}
      {showMessage && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.p
            className="text-base font-semibold login-shimmer-text"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </div>
  );

  // Full screen version with background
  if (fullScreen) {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at center, #0a1f1a 0%, #030a08 50%, #000000 100%)'
        }}
      >
        {/* Subtle background glow orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/30 rounded-full blur-[180px]" />
        <div className="absolute top-[40%] right-[5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px]" />
        
        {LoaderContent}
      </div>
    );
  }

  // Inline version
  return LoaderContent;
});

PremiumGlobalLoader.displayName = 'PremiumGlobalLoader';

export default PremiumGlobalLoader;
