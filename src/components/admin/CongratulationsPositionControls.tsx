import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface CongratulationsPositionControlsProps {
  position: {
    top: number;
    right: number;
    width: number;
    height: number;
  };
  onPositionChange: (position: { top: number; right: number; width: number; height: number }) => void;
  onReset: () => void;
}

export default function CongratulationsPositionControls({
  position,
  onPositionChange,
  onReset,
}: CongratulationsPositionControlsProps) {
  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Congratulations Image Position</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-8 gap-2"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        {/* Top Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Top Position</Label>
            <span className="text-xs font-mono text-foreground">{position.top}%</span>
          </div>
          <Slider
            value={[position.top]}
            onValueChange={([value]) => onPositionChange({ ...position, top: value })}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Right Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Right Position</Label>
            <span className="text-xs font-mono text-foreground">{position.right}%</span>
          </div>
          <Slider
            value={[position.right]}
            onValueChange={([value]) => onPositionChange({ ...position, right: value })}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Width */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Width</Label>
            <span className="text-xs font-mono text-foreground">{position.width}%</span>
          </div>
          <Slider
            value={[position.width]}
            onValueChange={([value]) => onPositionChange({ ...position, width: value })}
            min={20}
            max={80}
            step={1}
            className="w-full"
          />
        </div>

        {/* Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Height</Label>
            <span className="text-xs font-mono text-foreground">{position.height}%</span>
          </div>
          <Slider
            value={[position.height]}
            onValueChange={([value]) => onPositionChange({ ...position, height: value })}
            min={5}
            max={30}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
