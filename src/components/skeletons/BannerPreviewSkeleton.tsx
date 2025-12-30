import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const BannerPreviewSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading preview..." size="xl" />
));

BannerPreviewSkeleton.displayName = 'BannerPreviewSkeleton';
export default BannerPreviewSkeleton;