import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Save, Plus, Minus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

interface StickerPreciseControlsProps {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
}

export default function StickerPreciseControls({
  position,
  scale,
  rotation,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onSave,
  onReset,
  isSaving,
}: StickerPreciseControlsProps) {
  const POSITION_STEP = 2;
  const SCALE_STEP = 0.1;

  const handleScaleIncrease = () => {
    const newScale = Math.min(3.0, scale + SCALE_STEP);
    onScaleChange(newScale);
  };

  const handleScaleDecrease = () => {
    const newScale = Math.max(0.3, scale - SCALE_STEP);
    onScaleChange(newScale);
  };

  const handleMoveLeft = () => {
    const newX = Math.max(0, position.x - POSITION_STEP);
    onPositionChange(newX, position.y);
  };

  const handleMoveRight = () => {
    const newX = Math.min(100, position.x + POSITION_STEP);
    onPositionChange(newX, position.y);
  };

  const handleMoveUp = () => {
    const newY = Math.max(0, position.y - POSITION_STEP);
    onPositionChange(position.x, newY);
  };

  const handleMoveDown = () => {
    const newY = Math.min(100, position.y + POSITION_STEP);
    onPositionChange(position.x, newY);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Sticker Transform Controls
          </h3>
          <p className="text-sm text-muted-foreground">
            Fine-tune sticker position and size using quick controls
          </p>
        </div>

        {/* Scale/Size Control Line */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Scale / Size</span>
            <span className="text-sm text-primary font-semibold">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleScaleDecrease}
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 hover:bg-accent hover:scale-110 transition-transform"
              disabled={scale <= 0.3}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((scale - 0.3) / (3.0 - 0.3)) * 100}%` }}
              />
            </div>
            <Button
              onClick={handleScaleIncrease}
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 hover:bg-accent hover:scale-110 transition-transform"
              disabled={scale >= 3.0}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Range: 30% to 300%
          </p>
        </div>

        {/* Position Control Left/Right Line */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Position Left/Right</span>
            <span className="text-sm text-primary font-semibold">
              X: {Math.round(position.x)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleMoveLeft}
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 hover:bg-accent hover:scale-110 transition-transform"
              disabled={position.x <= 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${position.x}%` }}
              />
            </div>
            <Button
              onClick={handleMoveRight}
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 hover:bg-accent hover:scale-110 transition-transform"
              disabled={position.x >= 100}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Position Control Top/Bottom Line */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Position Top/Bottom</span>
            <span className="text-sm text-primary font-semibold">
              Y: {Math.round(position.y)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleMoveUp}
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 hover:bg-accent hover:scale-110 transition-transform"
              disabled={position.y <= 0}
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${position.y}%` }}
              />
            </div>
            <Button
              onClick={handleMoveDown}
              variant="outline"
              size="icon"
              className="h-12 w-12 border-2 hover:bg-accent hover:scale-110 transition-transform"
              disabled={position.y >= 100}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5 animate-pulse" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Changes
              </span>
            )}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="border-2 h-12 px-6"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
