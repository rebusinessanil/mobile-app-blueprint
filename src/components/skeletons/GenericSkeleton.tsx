import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const GenericSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading..." size="xl" />
));

GenericSkeleton.displayName = 'GenericSkeleton';
export default GenericSkeleton;