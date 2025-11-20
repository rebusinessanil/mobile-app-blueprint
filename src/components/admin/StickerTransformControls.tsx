import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { useStickerTransform } from "@/hooks/useStickerTransform";
import { toast } from "sonner";

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
  // Store initial saved state
  const [savedState, setSavedState] = useState({
    position_x: initialTransform.position_x || 50,
    position_y: initialTransform.position_y || 50,
    scale: initialTransform.scale || 1.0,
    rotation: initialTransform.rotation || 0,
  });

  // Current editing state (temporary until Save)
  const [positionX, setPositionX] = useState(savedState.position_x);
  const [positionY, setPositionY] = useState(savedState.position_y);
  const [scale, setScale] = useState(savedState.scale);
  const [rotation, setRotation] = useState(savedState.rotation);
  
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

    const handleMouseUp = () => {
      // Don't save immediately - just stop dragging/resizing/rotating
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

  // Position presets (9-box grid)
  const positionPresets = [
    { name: "Top Left", x: 15, y: 15 },
    { name: "Top Center", x: 50, y: 15 },
    { name: "Top Right", x: 85, y: 15 },
    { name: "Middle Left", x: 15, y: 50 },
    { name: "Center", x: 50, y: 50 },
    { name: "Middle Right", x: 85, y: 50 },
    { name: "Bottom Left", x: 15, y: 85 },
    { name: "Bottom Center", x: 50, y: 85 },
    { name: "Bottom Right", x: 85, y: 85 },
  ];

  // Scale presets
  const scalePresets = [
    { name: "Small", value: 0.5 },
    { name: "Medium", value: 1.0 },
    { name: "Large", value: 1.5 },
  ];

  const applyPositionPreset = (x: number, y: number) => {
    setPositionX(x);
    setPositionY(y);
  };

  const applyScalePreset = (scaleValue: number) => {
    setScale(scaleValue);
  };

  const handleSave = async () => {
    try {
      await updateTransform({
        position_x: positionX,
        position_y: positionY,
        scale: scale,
        rotation: rotation,
      });
      
      // Update saved state
      const newState = {
        position_x: positionX,
        position_y: positionY,
        scale,
        rotation,
      };
      setSavedState(newState);
      onTransformChange?.(newState);
      
      toast.success("Sticker positioning saved successfully!");
    } catch (error) {
      toast.error("Failed to save sticker positioning");
    }
  };

  const handleReset = () => {
    // Revert to last saved state
    setPositionX(savedState.position_x);
    setPositionY(savedState.position_y);
    setScale(savedState.scale);
    setRotation(savedState.rotation);
    toast.info("Reset to last saved state");
  };

  return (
    <div className="space-y-4">
      {/* Save and Reset Controls */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isSaving}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Position Presets (9-box grid) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Position Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {positionPresets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPositionPreset(preset.x, preset.y)}
              disabled={isSaving}
              className="text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Scale Presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Scale Presets</label>
        <div className="flex gap-2">
          {scalePresets.map((preset) => (
            <Button
              key={preset.name}
              variant={scale === preset.value ? "default" : "outline"}
              size="sm"
              onClick={() => applyScalePreset(preset.value)}
              disabled={isSaving}
              className="flex-1"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[400px] bg-secondary/20 border-2 border-dashed border-primary/30 rounded-xl overflow-hidden"
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

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Position:</span> X: {positionX.toFixed(1)}%, Y: {positionY.toFixed(1)}%
        </div>
        <div>
          <span className="text-muted-foreground">Scale:</span> {scale.toFixed(2)}x
        </div>
        <div>
          <span className="text-muted-foreground">Rotation:</span> {rotation.toFixed(0)}°
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span> {isSaving ? "Saving..." : "Saved"}
        </div>
      </div>
    </div>
  );
}
