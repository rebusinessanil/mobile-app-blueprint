import { useState } from "react";
import { Plus, Move, Maximize2, Save, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface StickerControlProps {
  onAddSticker: () => void;
  onResizeSticker: (scale: number) => void;
  onToggleDragMode: (enabled: boolean) => void;
  onSave?: () => void;
  onReset?: () => void;
  currentScale: number;
  isDragMode: boolean;
  isSaving?: boolean;
  isAdmin?: boolean;
}

export default function StickerControl({
  onAddSticker,
  onResizeSticker,
  onToggleDragMode,
  onSave,
  onReset,
  currentScale,
  isDragMode,
  isSaving = false,
  isAdmin = false,
}: StickerControlProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Control Panel */}
      <div
        className={`
          bg-background/95 backdrop-blur-sm
          border-2 border-primary/40
          rounded-2xl shadow-2xl
          transition-all duration-300 ease-out
          ${isExpanded ? "p-6 w-72" : "p-4 w-auto"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-foreground tracking-wide">
              STICKER CONTROL
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
          >
            {isExpanded ? "−" : "+"}
          </Button>
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Add Sticker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Add Sticker
              </label>
              <Button
                onClick={onAddSticker}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Sticker
              </Button>
            </div>

            {/* Resize Sticker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resize Sticker
                </label>
                <span className="text-xs text-primary font-bold">
                  {Math.round(currentScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[currentScale]}
                  onValueChange={(values) => onResizeSticker(values[0])}
                  min={2}
                  max={3.5}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Move Sticker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Move Sticker
              </label>
              <Button
                onClick={() => onToggleDragMode(!isDragMode)}
                variant={isDragMode ? "default" : "outline"}
                className={`
                  w-full rounded-xl h-11 font-semibold
                  ${
                    isDragMode
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-primary/40 text-foreground hover:bg-primary/10"
                  }
                `}
              >
                <Move className="w-5 h-5 mr-2" />
                {isDragMode ? "Drag Mode Active" : "Enable Drag Mode"}
              </Button>
            </div>

            {/* Save & Reset Buttons - Admin Only */}
            {isAdmin && onSave && onReset && (
              <div className="flex gap-2">
                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 font-semibold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={onReset}
                  variant="outline"
                  className="flex-1 border-primary/40 text-foreground hover:bg-primary/10 rounded-xl h-10 font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}

            {/* Info Text */}
            {isDragMode && (
              <div className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-3 border border-primary/20">
                <span className="text-primary font-semibold">Tip:</span> Click and
                drag the sticker to reposition it within the banner.
                {!isAdmin && (
                  <span className="block mt-1 text-xs opacity-75">
                    Changes are temporary and will reset on page reload.
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsed State Button */}
        {!isExpanded && (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="ghost"
            className="w-full text-primary hover:bg-primary/10 font-semibold text-sm"
          >
            Open Controls
          </Button>
        )}
      </div>
    </div>
  );
}
