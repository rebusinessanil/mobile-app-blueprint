import { getSlotBackgroundStyle, BackgroundSlot } from "@/hooks/useGlobalBackgroundSlots";

interface StickerImage {
  id: string;
  url: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
}

interface ProxyPreviewSlotProps {
  slot: BackgroundSlot;
  isSelected: boolean;
  onClick: () => void;
  primaryPhoto?: string;
  profileName?: string;
  displayRank?: string;
  stickers?: StickerImage[];
  stickerScale?: Record<string, number>;
  categoryType?: string;
  bannerDefaults?: {
    logo_left?: string | null;
    logo_right?: string | null;
    congratulations_image?: string | null;
  } | null;
  rankIcon?: string;
}

/**
 * ProxyPreviewSlot - Renders a miniature version of the full banner
 * for the 16-slot grid preview. Uses only the FIRST profile photo
 * (proxy mode) to show how each background looks with full banner data.
 */
export default function ProxyPreviewSlot({
  slot,
  isSelected,
  onClick,
  primaryPhoto,
  profileName = "",
  displayRank = "",
  stickers = [],
  stickerScale = {},
  categoryType = "rank",
  bannerDefaults,
  rankIcon
}: ProxyPreviewSlotProps) {
  // Truncate name for miniature display
  const truncatedName = profileName.length > 12 
    ? profileName.substring(0, 12) + "..." 
    : profileName;

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg overflow-hidden transition-all relative ${
        isSelected
          ? "border-4 border-[#FFD700] scale-105 shadow-[0_0_20px_rgba(255,215,0,0.5)]"
          : "border-2 border-gray-600 hover:border-[#FFD700] hover:scale-105"
      }`}
    >
      {/* Background Layer */}
      <div
        className="w-full h-full absolute inset-0"
        style={getSlotBackgroundStyle(slot)}
      />

      {/* Proxy Banner Content - Scaled down version */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top Logos - Miniature */}
        {bannerDefaults && (
          <div className="absolute top-[3%] left-[3%] right-[3%] flex justify-between items-center z-10">
            {bannerDefaults.logo_left && (
              <img
                src={bannerDefaults.logo_left}
                alt="Logo"
                className="h-[12%] w-auto object-contain opacity-80"
              />
            )}
            {bannerDefaults.logo_right && (
              <img
                src={bannerDefaults.logo_right}
                alt="Logo"
                className="h-[12%] w-auto object-contain opacity-80"
              />
            )}
          </div>
        )}

        {/* Profile Photo - Center Left Area (Proxy: First Photo Only) */}
        {primaryPhoto && (
          <div
            className="absolute z-10 overflow-hidden"
            style={{
              left: "3%",
              top: "15%",
              width: "35%",
              height: "50%",
              borderRadius: "8%",
              border: "2px solid rgba(255, 215, 0, 0.5)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
            }}
          >
            <img
              src={primaryPhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Rank Icon - Miniature */}
        {rankIcon && categoryType === "rank" && (
          <div
            className="absolute z-15"
            style={{
              right: "5%",
              top: "12%",
              width: "25%",
              height: "25%"
            }}
          >
            <img
              src={rankIcon}
              alt="Rank"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        )}

        {/* Stickers - Miniature positioned */}
        {stickers.map((sticker) => {
          const finalScale = (stickerScale[sticker.id] ?? sticker.scale ?? 1) * 0.08;
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
                width: "40px",
                height: "40px",
                objectFit: "contain",
                zIndex: 12
              }}
            />
          );
        })}

        {/* Bottom Name & Rank - Miniature */}
        <div
          className="absolute bottom-[5%] left-0 right-0 text-center z-20 px-1"
        >
          {truncatedName && (
            <p
              className="text-white font-bold uppercase leading-tight"
              style={{
                fontSize: "clamp(6px, 2.5vw, 10px)",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                marginBottom: "1px"
              }}
            >
              {truncatedName.toUpperCase()}
            </p>
          )}
          {displayRank && (
            <p
              className="text-[#FFD700] font-semibold uppercase leading-tight"
              style={{
                fontSize: "clamp(5px, 2vw, 8px)",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
              }}
            >
              {displayRank}
            </p>
          )}
        </div>

        {/* Slot Number Overlay - For identification */}
        {!slot.hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold opacity-60">
              {slot.slotNumber}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
