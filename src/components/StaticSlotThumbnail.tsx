import React, { memo } from "react";
import { getSlotBackgroundStyle, BackgroundSlot } from "@/hooks/useGlobalBackgroundSlots";
import proxyModelAchiever from "@/assets/proxy-model-achiever.png";
import proxyModelUser from "@/assets/proxy-model-user.png";

interface StaticSlotThumbnailProps {
  slot: BackgroundSlot;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Ultra-lightweight static slot thumbnail
 * - No dynamic content rendering
 * - No sticker loading
 * - No nameplate computation
 * - Pure static proxy images only
 * - Zero re-renders during main banner generation
 */
const StaticSlotThumbnail = memo(({ slot, isSelected, onClick }: StaticSlotThumbnailProps) => {
  // Calculate variant color based on slot number
  const variantIndex = ((slot.slotNumber - 1) % 3) + 1;
  const variants = {
    1: { borderColor: '#ef4444' },
    2: { borderColor: '#f97316' },
    3: { borderColor: '#14b8a6' }
  };
  const variant = variants[variantIndex as keyof typeof variants];

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg overflow-hidden transition-transform duration-150 ${
        isSelected 
          ? 'border-4 border-primary scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]' 
          : 'border-2 border-muted hover:border-primary/50 hover:scale-105'
      }`}
    >
      <div 
        className="w-full h-full relative"
        style={{ 
          ...getSlotBackgroundStyle(slot),
          position: 'relative'
        }}
      >
        {/* Static proxy achiever - LEFT */}
        <div
          className="absolute"
          style={{
            left: '3%',
            top: '12%',
            width: '44%',
            height: '59%',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <img 
            src={proxyModelAchiever} 
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: 'auto',
              transform: 'translateZ(0)'
            }}
          />
        </div>

        {/* Static proxy user - BOTTOM RIGHT */}
        <div
          className="absolute"
          style={{
            right: 0,
            bottom: 0,
            width: '40%',
            height: '40%',
            borderRadius: '4px 0 0 0',
            overflow: 'hidden',
          }}
        >
          <img 
            src={proxyModelUser} 
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: 'auto',
              transform: 'translateZ(0)'
            }}
          />
        </div>

        {/* Static nameplate bar - simplified */}
        <div
          className="absolute"
          style={{
            bottom: '2%',
            left: '2%',
            right: '42%',
            height: '9%',
            background: `linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)`,
            borderRadius: '3px',
            border: `2px solid ${variant.borderColor}`,
          }}
        />

        {/* Slot number indicator */}
        <div
          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center"
          style={{ fontSize: '8px', color: '#fff', fontWeight: 'bold' }}
        >
          {slot.slotNumber}
        </div>
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selection changes
  return prevProps.isSelected === nextProps.isSelected && 
         prevProps.slot.slotNumber === nextProps.slot.slotNumber &&
         prevProps.slot.imageUrl === nextProps.slot.imageUrl;
});

StaticSlotThumbnail.displayName = 'StaticSlotThumbnail';

export default StaticSlotThumbnail;
