import React from "react";
import { getSlotBackgroundStyle, BackgroundSlot } from "@/hooks/useGlobalBackgroundSlots";

// Universal default model for slot previews (excludes Story & Motivational categories)
import slotDefaultModel from "@/assets/slot-default-model.png";

// Single universal placeholder model for all slots requiring person/image
const SLOT_DEFAULT_MODEL = slotDefaultModel;

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

interface StickerImage {
  id: string;
  url: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
}

interface SlotPreviewMiniProps {
  slot: BackgroundSlot;
  isSelected: boolean;
  onClick: () => void;
  // Banner data props
  categoryType?: 'rank' | 'bonanza' | 'birthday' | 'anniversary' | 'meeting' | 'festival' | 'motivational' | 'story';
  rankName?: string;
  name?: string;
  teamCity?: string;
  chequeAmount?: string;
  tripName?: string;
  message?: string;
  quote?: string;
  // Asset URLs
  congratulationsImage?: string;
  logoLeft?: string;
  logoRight?: string;
  // Uplines
  uplines?: Upline[];
  // Stickers for this slot
  stickers?: StickerImage[];
  // Profile info for nameplate
  profileName?: string;
  profileRank?: string;
}

export default function SlotPreviewMini({
  slot,
  isSelected,
  onClick,
  categoryType = 'rank',
  rankName = '',
  name = '',
  teamCity = '',
  chequeAmount = '',
  tripName = '',
  message = '',
  quote = '',
  congratulationsImage,
  logoLeft,
  logoRight,
  uplines = [],
  stickers = [],
  profileName = '',
  profileRank = ''
}: SlotPreviewMiniProps) {
  // Scale factor for the mini preview (1350px -> approximately 80px visible)
  const SCALE_FACTOR = 0.06;
  
  // Truncate name for display
  const truncatedName = name.length > 20 ? name.slice(0, 17) + '...' : name;
  const truncatedProfileName = profileName.length > 15 ? profileName.slice(0, 12) + '...' : profileName;
  const displayRank = profileRank || 'TEAM MEMBER';

  // Render category-specific content
  const renderCategoryContent = () => {
    switch (categoryType) {
      case 'bonanza':
        return (
          <>
            {/* Congratulations Image */}
            {congratulationsImage && (
              <div className="absolute z-20" style={{
                top: '162px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                height: '162px'
              }}>
                <img src={congratulationsImage} alt="Congratulations" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} />
              </div>
            )}
            {/* Trip Achievement Title */}
            <div className="absolute z-20" style={{
              top: '236px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '42px',
                fontWeight: '600',
                color: '#ffffff',
                letterSpacing: '1px'
              }}>
                BONANZA TRIP WINNER
              </p>
            </div>
            {/* Trip Name */}
            <div className="absolute" style={{
              top: '337px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px'
            }}>
              <h2 style={{
                color: '#FFD700',
                textAlign: 'center',
                fontSize: '48px',
                fontWeight: '700',
                margin: 0
              }}>
                {tripName?.toUpperCase() || 'TRIP DESTINATION'}
              </h2>
            </div>
            {/* Achiever Name */}
            <div className="absolute" style={{
              top: '420px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px'
            }}>
              <h3 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '36px',
                fontWeight: '600',
                margin: 0
              }}>
                {truncatedName.toUpperCase()}
              </h3>
            </div>
          </>
        );

      case 'birthday':
        return (
          <>
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '120px'
            }}>
              🎂
            </div>
            <div className="absolute z-20" style={{
              top: '280px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '52px',
                fontWeight: '700',
                color: '#FFD700',
                letterSpacing: '2px'
              }}>
                HAPPY BIRTHDAY
              </p>
            </div>
            <div className="absolute" style={{
              top: '370px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '44px',
                fontWeight: '600',
                margin: 0
              }}>
                {truncatedName.toUpperCase()}
              </h2>
            </div>
          </>
        );

      case 'anniversary':
        return (
          <>
            <div className="absolute z-20" style={{
              top: '140px',
              left: '978px',
              transform: 'translateX(-50%)',
              fontSize: '120px'
            }}>
              💞
            </div>
            <div className="absolute z-20" style={{
              top: '280px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#FFD700',
                letterSpacing: '1px'
              }}>
                HAPPY ANNIVERSARY
              </p>
            </div>
            <div className="absolute" style={{
              top: '370px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '40px',
                fontWeight: '600',
                margin: 0
              }}>
                {truncatedName.toUpperCase()}
              </h2>
            </div>
          </>
        );

      case 'festival':
        return (
          <>
            <div className="absolute z-20" style={{
              top: '280px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#FFD700',
                letterSpacing: '1px'
              }}>
                FESTIVAL GREETINGS
              </p>
            </div>
            <div className="absolute" style={{
              top: '370px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '40px',
                fontWeight: '600',
                margin: 0
              }}>
                {truncatedName.toUpperCase()}
              </h2>
            </div>
          </>
        );

      case 'motivational':
        return (
          <>
            {quote && (
              <div className="absolute" style={{
                top: '360px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                padding: '0 50px'
              }}>
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '32px',
                  fontWeight: '500',
                  fontStyle: 'italic',
                  lineHeight: '1.5'
                }}>
                  "{quote}"
                </p>
              </div>
            )}
            {truncatedName && (
              <div className="absolute" style={{
                top: '520px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px'
              }}>
                <p style={{
                  color: '#FFD700',
                  textAlign: 'center',
                  fontSize: '30px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  - {truncatedName.toUpperCase()}
                </p>
              </div>
            )}
          </>
        );

      case 'story':
        return null;

      default: // 'rank' category
        return (
          <>
            {/* Congratulations Image */}
            {congratulationsImage && (
              <div className="absolute z-20" style={{
                top: '162px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px',
                height: '162px'
              }}>
                <img src={congratulationsImage} alt="Congratulations" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} />
              </div>
            )}

            {/* Nameplate Border */}
            <div className="absolute z-20" style={{
              top: '205px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '2769px',
              height: '346px'
            }}>
              <img 
                src="/assets/nameplate-border.png" 
                alt="Nameplate Border" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }} 
              />
            </div>

            {/* Achiever Name */}
            <div className="absolute z-30" style={{
              top: '340px',
              left: '978px',
              transform: 'translateX(-50%)',
              width: '648px',
              height: '81px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h2 style={{
                color: '#ffffff',
                textAlign: 'center',
                fontSize: '48px',
                fontWeight: '700',
                margin: 0,
                whiteSpace: 'nowrap'
              }}>
                {truncatedName.toUpperCase()}
              </h2>
            </div>

            {/* Team Name */}
            {teamCity && (
              <div className="absolute" style={{
                top: '423px',
                left: '978px',
                transform: 'translateX(-50%)',
                width: '648px'
              }}>
                <p style={{
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: '28px'
                }}>
                  {teamCity.toUpperCase()}
                </p>
              </div>
            )}

            {/* Income Section */}
            {chequeAmount && (
              <div className="absolute" style={{
                bottom: '202px',
                left: '67px',
                width: '743px'
              }}>
                <p style={{
                  fontSize: '36px',
                  color: '#ffffff',
                  fontWeight: '500',
                  textAlign: 'left',
                  margin: 0,
                  marginBottom: '28px'
                }}>
                  THIS WEEK INCOME
                </p>
                <p style={{
                  fontSize: '62px',
                  fontWeight: '800',
                  color: '#FFD600',
                  textAlign: 'left',
                  margin: 0
                }}>
                  {Number(chequeAmount).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </>
        );
    }
  };

  // *** MOBILE-FIRST: Fixed scale calculated once on mount ***
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dynamicScale, setDynamicScale] = React.useState(SCALE_FACTOR);
  const scaleCalculatedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    // Calculate scale ONCE on mount - no resize listener for mobile stability
    if (scaleCalculatedRef.current) return;
    
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        if (containerWidth > 0) {
          // Scale banner (1350px) to fit container width perfectly
          const newScale = containerWidth / 1350;
          setDynamicScale(newScale);
          scaleCalculatedRef.current = true;
        }
      }
    };

    calculateScale();
    
    // Fallback: If container not ready, retry once with RAF
    if (!scaleCalculatedRef.current) {
      requestAnimationFrame(calculateScale);
    }
  }, []);

  return (
    <button
      onClick={onClick}
      className={`slot-preview-mini aspect-square rounded-lg overflow-hidden ${
        isSelected 
          ? 'border-4 border-[#FFD700] scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]' 
          : 'border-2 border-gray-600'
      }`}
      style={{ 
        transition: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      <div 
        ref={containerRef}
        className="w-full h-full relative overflow-hidden"
        style={{ 
          ...getSlotBackgroundStyle(slot),
          position: 'relative',
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          contain: 'strict',
        }}
      >
        {/* Scaled banner content wrapper - CLEAN SLOT PREVIEW: Only background + stickers */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1350px',
            height: '1350px',
            transform: `scale(${dynamicScale}) translateZ(0)`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            transition: 'none',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* CLEAN SLOT PREVIEW: Only show default model for categories that need person/image */}
          {/* EXCLUDED: Story and Motivational categories - they remain unchanged */}
          {categoryType !== 'story' && categoryType !== 'motivational' && (
            <div className="absolute overflow-hidden" style={{
              left: '40px',
              top: '162px',
              width: '594px',
              height: '792px',
              borderRadius: '24px'
            }}>
              <img 
                src={SLOT_DEFAULT_MODEL} 
                alt="Default Model" 
                style={{
                  width: '594px',
                  height: '792px',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }} 
              />
            </div>
          )}

          {/* Stickers - Render ALL stickers from the slot */}
          {stickers.map((sticker) => {
            const finalScale = sticker.scale ?? 9.3;
            return (
              <img
                key={sticker.id}
                src={sticker.url}
                alt="Sticker"
                className="absolute pointer-events-none"
                style={{
                  left: `${sticker.position_x ?? 77}%`,
                  top: `${sticker.position_y ?? 62}%`,
                  transform: `translate(-50%, -50%) scale(${finalScale}) rotate(${sticker.rotation ?? 0}deg)`,
                  transformOrigin: 'center center',
                  width: '145px',
                  height: '145px',
                  objectFit: 'contain',
                  zIndex: 10
                }}
              />
            );
          })}
        </div>
      </div>
    </button>
  );
}
