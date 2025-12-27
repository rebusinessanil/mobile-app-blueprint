import { memo } from "react";
import GoldCoinLoader from "@/components/GoldCoinLoader";

const GenericSkeleton = memo(() => (
  <div className="min-h-screen bg-navy-dark flex items-center justify-center">
    <GoldCoinLoader size="xl" message="Loading..." />
  </div>
));

GenericSkeleton.displayName = 'GenericSkeleton';
export default GenericSkeleton;