import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const BannerCreateSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading banner creator..." size="xl" />
));

BannerCreateSkeleton.displayName = 'BannerCreateSkeleton';
export default BannerCreateSkeleton;