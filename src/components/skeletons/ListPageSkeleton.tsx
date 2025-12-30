import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const ListPageSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading..." size="xl" />
));

ListPageSkeleton.displayName = 'ListPageSkeleton';
export default ListPageSkeleton;