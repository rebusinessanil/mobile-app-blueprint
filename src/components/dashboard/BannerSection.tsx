import { memo } from "react";
import { Link } from "react-router-dom";
import BannerCard from "./BannerCard";

interface BannerSectionProps {
  title: string;
  icon: string;
  seeAllLink: string;
  templates: any[];
  dataItems: any[];
  getItemData: (template: any) => {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    fallbackIcon?: string;
    fallbackGradient?: string;
    linkTo: string;
  };
}

function BannerSectionContent({
  title,
  icon,
  seeAllLink,
  templates,
  dataItems,
  getItemData
}: BannerSectionProps) {
  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between pl-4 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
        </div>
        <Link 
          to={seeAllLink} 
          className="text-primary text-sm font-semibold hover:underline"
        >
          See All →
        </Link>
      </div>

      {/* Banner Cards - 3 per row with horizontal scroll */}
      <div 
        className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {templates.map((template) => {
          const itemData = getItemData(template);
          return (
            <BannerCard
              key={template.id}
              id={itemData.id}
              title={itemData.title}
              subtitle={itemData.subtitle}
              imageUrl={itemData.imageUrl}
              fallbackIcon={itemData.fallbackIcon}
              fallbackGradient={itemData.fallbackGradient}
              linkTo={itemData.linkTo}
            />
          );
        })}
      </div>
    </div>
  );
}

export default memo(BannerSectionContent);
