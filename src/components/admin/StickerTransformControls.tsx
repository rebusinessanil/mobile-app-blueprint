import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Maximize2, Move, Grid3x3, Zap } from "lucide-react";
import { useStickerTransform } from "@/hooks/useStickerTransform";
import { Badge } from "@/components/ui/badge";

// Scale presets
const SCALE_PRESETS = {
  small: 0.6,
  medium: 1.0,
  large: 1.5,
};

// 9-box grid position presets (percentage-based)
const POSITION_PRESETS = {
  topLeft: { x: 15, y: 15 },
  topCenter: { x: 50, y: 15 },
  topRight: { x: 85, y: 15 },
  centerLeft: { x: 15, y: 50 },
  center: { x: 50, y: 50 },
  centerRight: { x: 85, y: 50 },
  bottomLeft: { x: 15, y: 85 },
  bottomCenter: { x: 50, y: 85 },
  bottomRight: { x: 85, y: 85 },
};

interface StickerTransformControlsProps {
  stickerId: string;
  rankId: string;
  categoryId: string;
  slotNumber: number;
  imageUrl: string;
  initialTransform?: {
    position_x?: number;
    position_y?: number;
    scale?: number;
    rotation?: number;
  };
  onTransformChange?: (transform: any) => void;
}

export default function StickerTransformControls({
  stickerId,
  rankId,
  categoryId,
  slotNumber,
  imageUrl,
  initialTransform = {},
  onTransformChange,
}: StickerTransformControlsProps) {
  const [positionX, setPositionX] = useState(initialTransform.position_x || 50);
  const [positionY, setPositionY] = useState(initialTransform.position_y || 50);
  const [scale, setScale] = useState(initialTransform.scale || 1.0);
  const [rotation, setRotation] = useState(initialTransform.rotation || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateTransform, isSaving } = useStickerTransform(stickerId, rankId, categoryId, slotNumber);

  const handleMouseDown = (e: React.MouseEvent, mode: "drag" | "resize" | "rotate") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (mode === "drag") setIsDragging(true);
    if (mode === "resize") setIsResizing(true);
    if (mode === "rotate") setIsRotating(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const newY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setPositionX(newX);
        setPositionY(newY);
      }

      if (isResizing) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
        const baseDistance = Math.min(rect.width, rect.height) / 2;
        const newScale = Math.max(0.5, Math.min(2.0, distance / baseDistance));
        setScale(newScale);
      }

      if (isRotating) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setRotation((angle + 360) % 360);
      }
    };

    const handleMouseUp = async () => {
      if (isDragging || isResizing || isRotating) {
        await updateTransform({
          position_x: positionX,
          position_y: positionY,
          scale: scale,
          rotation: rotation,
        });
        onTransformChange?.({ position_x: positionX, position_y: positionY, scale, rotation });
      }
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, positionX, positionY, scale, rotation, updateTransform, onTransformChange]);

  const resetTransform = async () => {
    setPositionX(50);
    setPositionY(50);
    setScale(1.0);
    setRotation(0);
    await updateTransform({
      position_x: 50,
      position_y: 50,
      scale: 1.0,
      rotation: 0,
    });
    onTransformChange?.({ position_x: 50, position_y: 50, scale: 1.0, rotation: 0 });
  };

  const applyScalePreset = async (presetScale: number) => {
    setScale(presetScale);
    await updateTransform({ scale: presetScale });
    onTransformChange?.({ position_x: positionX, position_y: positionY, scale: presetScale, rotation });
  };

  const applyPositionPreset = async (preset: { x: number; y: number }) => {
    setPositionX(preset.x);
    setPositionY(preset.y);
    await updateTransform({ position_x: preset.x, position_y: preset.y });
    onTransformChange?.({ position_x: preset.x, position_y: preset.y, scale, rotation });
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isSaving}
        >
          <Move className="w-4 h-4" />
          Manual Drag
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={resetTransform}
          disabled={isSaving}
        >
          Reset All
        </Button>
      </div>

      {/* Scale Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">One-Click Scale</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={scale === SCALE_PRESETS.small ? "default" : "outline"}
            size="sm"
            onClick={() => applyScalePreset(SCALE_PRESETS.small)}
            disabled={isSaving}
            className="relative"
          >
            Small
            {scale === SCALE_PRESETS.small && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">✓</Badge>
            )}
          </Button>
          <Button
            variant={scale === SCALE_PRESETS.medium ? "default" : "outline"}
            size="sm"
            onClick={() => applyScalePreset(SCALE_PRESETS.medium)}
            disabled={isSaving}
            className="relative"
          >
            Medium
            {scale === SCALE_PRESETS.medium && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">✓</Badge>
            )}
          </Button>
          <Button
            variant={scale === SCALE_PRESETS.large ? "default" : "outline"}
            size="sm"
            onClick={() => applyScalePreset(SCALE_PRESETS.large)}
            disabled={isSaving}
            className="relative"
          >
            Large
            {scale === SCALE_PRESETS.large && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">✓</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Position Presets - 9-Box Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">9-Box Position Grid</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(POSITION_PRESETS).map(([key, pos]) => {
            const isActive = Math.abs(positionX - pos.x) < 2 && Math.abs(positionY - pos.y) < 2;
            const labels: Record<string, string> = {
              topLeft: "↖",
              topCenter: "↑",
              topRight: "↗",
              centerLeft: "←",
              center: "●",
              centerRight: "→",
              bottomLeft: "↙",
              bottomCenter: "↓",
              bottomRight: "↘",
            };
            
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => applyPositionPreset(pos)}
                disabled={isSaving}
                className="h-12 text-xl relative"
              >
                {labels[key]}
                {isActive && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">✓</Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Canvas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Live Preview (Manual Adjust)</h4>
          <span className="text-xs text-muted-foreground">Drag, resize, or rotate</span>
        </div>
        <div
          ref={containerRef}
          className="relative w-full h-[350px] bg-secondary/20 border-2 border-dashed border-primary/30 rounded-xl overflow-hidden"
          style={{ cursor: isDragging ? "grabbing" : isResizing ? "nwse-resize" : isRotating ? "grab" : "default" }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-muted-foreground text-sm">Slot Boundaries</span>
          </div>
        
        {imageUrl && (
          <div
            className="absolute cursor-move"
            style={{
              left: `${positionX}%`,
              top: `${positionY}%`,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging || isResizing || isRotating ? "none" : "transform 0.2s ease",
            }}
            onMouseDown={(e) => handleMouseDown(e, "drag")}
          >
            <img
              src={imageUrl}
              alt="Sticker preview"
              className="w-24 h-24 object-contain pointer-events-none"
              draggable={false}
            />
            
            {/* Resize handle */}
            <div
              className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full cursor-nwse-resize border-2 border-background"
              onMouseDown={(e) => handleMouseDown(e, "resize")}
            />
            
            {/* Rotate handle */}
            <div
              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full cursor-grab border-2 border-background"
              onMouseDown={(e) => handleMouseDown(e, "rotate")}
            />
          </div>
        )}
      </div>

      </div>

      {/* Current Transform Values */}
      <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
        <div>
          <span className="text-muted-foreground">Position:</span> <span className="font-mono">X: {positionX.toFixed(1)}%, Y: {positionY.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Scale:</span> <span className="font-mono">{scale.toFixed(2)}x</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rotation:</span> <span className="font-mono">{rotation.toFixed(0)}°</span>
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span> <span className={isSaving ? "text-yellow-500" : "text-green-500"}>{isSaving ? "Saving..." : "✓ Saved"}</span>
        </div>
      </div>
    </div>
  );
}
