import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Save } from "lucide-react";

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
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Precise Transform Controls
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Fine-tune sticker position, size, and rotation using exact values
          </p>
        </div>

        {/* Position Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Position (X, Y)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pos-x" className="text-xs text-muted-foreground">
                X Coordinate
              </Label>
              <Input
                id="pos-x"
                type="number"
                value={Math.round(position.x)}
                onChange={(e) => onPositionChange(Number(e.target.value), position.y)}
                className="bg-background border-input"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-y" className="text-xs text-muted-foreground">
                Y Coordinate
              </Label>
              <Input
                id="pos-y"
                type="number"
                value={Math.round(position.y)}
                onChange={(e) => onPositionChange(position.x, Number(e.target.value))}
                className="bg-background border-input"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Scale Control */}
        <div className="space-y-2">
          <Label htmlFor="scale" className="text-sm font-medium text-foreground">
            Size / Scale
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="scale"
              type="number"
              value={scale.toFixed(2)}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              className="bg-background border-input"
              min="0.3"
              max="3"
              step="0.1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Range: 0.3 (30%) to 3.0 (300%)
          </p>
        </div>

        {/* Rotation Control */}
        <div className="space-y-2">
          <Label htmlFor="rotation" className="text-sm font-medium text-foreground">
            Rotation
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="rotation"
              type="number"
              value={Math.round(rotation)}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              className="bg-background border-input"
              min="-180"
              max="180"
              step="1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              degrees
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Range: -180° to 180°
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="border-border text-foreground hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
