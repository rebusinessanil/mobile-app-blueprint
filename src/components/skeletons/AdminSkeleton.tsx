import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const AdminSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading admin panel..." size="xl" />
));

AdminSkeleton.displayName = 'AdminSkeleton';
export default AdminSkeleton;