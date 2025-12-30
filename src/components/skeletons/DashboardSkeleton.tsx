import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const DashboardSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading dashboard..." size="xl" />
));

DashboardSkeleton.displayName = 'DashboardSkeleton';
export default DashboardSkeleton;