import { useState } from "react";
import { Move, ZoomIn, ZoomOut, RotateCw, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ProfilePhotoControlProps {
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onSave: () => void;
  onReset: () => void;
  currentScale: number;
  currentRotation: number;
  isDragMode: boolean;
  onToggleDragMode: (enabled: boolean) => void;
  isSaving: boolean;
}

export default function ProfilePhotoControl({
  onScaleChange,
  onRotationChange,
  onSave,
  onReset,
  currentScale,
  currentRotation,
  isDragMode,
  onToggleDragMode,
  isSaving,
}: ProfilePhotoControlProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="bg-[#0f1720] border-2 border-primary/30 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground font-semibold text-sm flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-primary" />
            Profile Photo Controls
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isDragMode ? "default" : "outline"}
              onClick={() => onToggleDragMode(!isDragMode)}
              className="h-8 px-3"
            >
              <Move className="w-3 h-3 mr-1" />
              {isDragMode ? "Drag ON" : "Drag OFF"}
            </Button>
          </div>
        </div>

        {/* Scale Control */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <ZoomIn className="w-3 h-3" />
                Size: {Math.round(currentScale * 100)}%
              </label>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[currentScale]}
                onValueChange={([value]) => onScaleChange(value)}
                min={0.5}
                max={2.0}
                step={0.05}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                Rotation: {currentRotation}°
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[currentRotation]}
                onValueChange={([value]) => onRotationChange(value)}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <RotateCw className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? "Saving..." : "Apply"}
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Drag Instructions */}
        {isDragMode && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Drag the profile photo to reposition it on the banner
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
