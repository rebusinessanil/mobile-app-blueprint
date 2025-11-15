import { useState } from "react";
import { Plus } from "lucide-react";
import UplineAvatarSlot from "./UplineAvatarSlot";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

interface UplineCarouselProps {
  uplines: Upline[];
  onUplinesChange: (uplines: Upline[]) => void;
  maxUplines?: number;
  adminPresets?: { id: string; name: string; avatar: string }[];
}

export default function UplineCarousel({ 
  uplines, 
  onUplinesChange, 
  maxUplines = 5,
  adminPresets = []
}: UplineCarouselProps) {
  const [showAddOptions, setShowAddOptions] = useState(false);

  const handleUpdateUpline = (index: number, avatar: string, name: string) => {
    const newUplines = [...uplines];
    if (index < newUplines.length) {
      newUplines[index] = { ...newUplines[index], avatar, name };
    } else {
      newUplines.push({ id: Date.now().toString(), avatar, name });
    }
    onUplinesChange(newUplines);
  };

  const handleRemoveUpline = (index: number) => {
    const newUplines = uplines.filter((_, i) => i !== index);
    onUplinesChange(newUplines);
  };

  // Fill empty slots up to maxUplines
  const slots = Array(maxUplines).fill(null).map((_, i) => uplines[i] || null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {slots.map((upline, index) => (
        <UplineAvatarSlot
          key={index}
          avatar={upline?.avatar}
          name={upline?.name}
          index={index}
          onUpdate={(avatar, name) => handleUpdateUpline(index, avatar, name)}
          onRemove={() => handleRemoveUpline(index)}
          adminPresets={adminPresets}
        />
      ))}
    </div>
  );
}