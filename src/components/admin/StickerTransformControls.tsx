import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCw, Maximize2, Move } from "lucide-react";
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
  const [positionX, setPositionX] = useState(initialTransform.position_x || 50);
  const [positionY, setPositionY] = useState(initialTransform.position_y || 50);
  const [scale, setScale] = useState(initialTransform.scale || 1.0);
  const [rotation, setRotation] = useState(initialTransform.rotation || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateTransform, isSaving } = useStickerTransform(stickerId, rankId, categoryId, slotNumber);

  // Store saved state for reset
  const [savedState, setSavedState] = useState({
    position_x: initialTransform.position_x || 50,
    position_y: initialTransform.position_y || 50,
    scale: initialTransform.scale || 1.0,
    rotation: initialTransform.rotation || 0,
  });

  const handleMouseDown = (e: React.MouseEvent, mode: "drag" | "resize" | "rotate") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (mode === "drag") setIsDragging(true);
    if (mode === "resize") setIsResizing(true);
    if (mode === "rotate") setIsRotating(true);
  };

  // Mark as changed when any transform value updates
  useEffect(() => {
    const changed = 
      positionX !== savedState.position_x ||
      positionY !== savedState.position_y ||
      scale !== savedState.scale ||
      rotation !== savedState.rotation;
    setHasChanges(changed);
  }, [positionX, positionY, scale, rotation, savedState]);

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
      if (isDragging || isResizing || isRotating) {
        // Just update local state, don't save to DB yet
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

  const handleSave = async () => {
    await updateTransform({
      position_x: positionX,
      position_y: positionY,
      scale: scale,
      rotation: rotation,
    });
    
    // Update saved state
    setSavedState({
      position_x: positionX,
      position_y: positionY,
      scale: scale,
      rotation: rotation,
    });
    
    setHasChanges(false);
    toast.success("Sticker position saved! Changes now visible to all users.");
  };

  const handleReset = () => {
    // Revert to last saved state
    setPositionX(savedState.position_x);
    setPositionY(savedState.position_y);
    setScale(savedState.scale);
    setRotation(savedState.rotation);
    onTransformChange?.(savedState);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 p-4 bg-secondary/20 rounded-lg border border-border">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Admin Sticker Editor
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag, resize, and rotate the sticker. Click <strong>Save</strong> to apply changes to all user banners.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="secondary" className="text-xs">
              <span className="w-2 h-2 rounded-full bg-primary mr-1" />
              Editable: Sticker Only
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 rounded-full bg-muted-foreground mr-1" />
              Locked: Profile, Logos, Contact
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-primary"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="gap-2">
          <Move className="w-3 h-3" />
          Drag to reposition
        </Badge>
        <Badge variant="outline" className="gap-2">
          <Maximize2 className="w-3 h-3" />
          Drag bottom-right to resize
        </Badge>
        <Badge variant="outline" className="gap-2">
          <RotateCw className="w-3 h-3" />
          Drag top-right to rotate
        </Badge>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[500px] bg-gradient-to-br from-secondary/30 to-secondary/10 border-2 border-primary/30 rounded-xl overflow-hidden"
        style={{ cursor: isDragging ? "grabbing" : isResizing ? "nwse-resize" : isRotating ? "grab" : "default" }}
      >
        {/* Banner Mockup - Non-editable Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10" />
          
          {/* Top Logos (Locked) */}
          <div className="absolute top-4 left-4 w-12 h-12 bg-muted/40 rounded-full flex items-center justify-center border border-border/50">
            <span className="text-xs text-muted-foreground">Logo</span>
          </div>
          <div className="absolute top-4 right-4 w-12 h-12 bg-muted/40 rounded-full flex items-center justify-center border border-border/50">
            <span className="text-xs text-muted-foreground">Logo</span>
          </div>

          {/* Profile Photo Bottom Right (Locked) */}
          <div className="absolute bottom-6 right-6 w-24 h-24 bg-muted/40 rounded-lg flex items-center justify-center border border-border/50">
            <span className="text-xs text-muted-foreground">Profile</span>
          </div>

          {/* Achiever Photo Left (Locked) */}
          <div className="absolute top-20 left-6 w-32 h-40 bg-muted/40 rounded-lg flex items-center justify-center border border-border/50">
            <span className="text-xs text-muted-foreground">Achiever</span>
          </div>

          {/* Name and Rank Bottom Center (Locked) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <div className="text-sm font-semibold text-muted-foreground mb-1">John Doe</div>
            <div className="text-xs text-muted-foreground">GOLD ACHIEVER</div>
          </div>

          {/* Upline Avatars Top (Locked) */}
          <div className="absolute top-20 right-6 flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 bg-muted/40 rounded-full border border-border/50" />
            ))}
          </div>

          {/* Contact Info (Locked) */}
          <div className="absolute bottom-20 left-6 text-xs text-muted-foreground space-y-1">
            <div>📞 +91 98765 43210</div>
            <div>✉️ example@email.com</div>
          </div>

          {/* Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-30 pointer-events-none">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Sticker Edit Zone</p>
            <p className="text-xs text-muted-foreground">All other elements locked</p>
          </div>
        </div>
        
        {/* Editable Sticker */}
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

      <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted/20 rounded-lg border border-border">
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
          <span className="text-muted-foreground">Status:</span> 
          {isSaving ? " Saving..." : hasChanges ? " Unsaved changes" : " Saved"}
        </div>
      </div>
    </div>
  );
}
