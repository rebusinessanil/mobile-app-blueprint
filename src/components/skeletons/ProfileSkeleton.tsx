import { memo } from "react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";

const ProfileSkeleton = memo(() => (
  <PremiumGlobalLoader message="Loading profile..." size="xl" />
));

ProfileSkeleton.displayName = 'ProfileSkeleton';
export default ProfileSkeleton;