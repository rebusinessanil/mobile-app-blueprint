import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const WalletSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading wallet..." size="xl" />
));

WalletSkeleton.displayName = 'WalletSkeleton';
export default WalletSkeleton;