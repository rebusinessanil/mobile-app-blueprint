import { useState, ReactNode, cloneElement, isValidElement } from "react";
import LoginPromptModal from "./LoginPromptModal";
import { useNavigate } from "react-router-dom";

interface ProtectedActionProps {
  /** The child element that triggers the action */
  children: ReactNode;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Name of the feature being accessed (for modal message) */
  featureName?: string;
  /** Optional click handler for authenticated users */
  onAuthenticatedClick?: () => void;
  /** Optional navigation path for authenticated users */
  navigateTo?: string;
}

/**
 * Wrapper component that intercepts clicks for guest users
 * and shows a login prompt modal instead of executing the action.
 * 
 * Usage:
 * <ProtectedAction isAuthenticated={!!userId} featureName="banner creation">
 *   <Button>Create Banner</Button>
 * </ProtectedAction>
 */
export default function ProtectedAction({ 
  children, 
  isAuthenticated, 
  featureName = "this feature",
  onAuthenticatedClick,
  navigateTo
}: ProtectedActionProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      e.stopPropagation();
      setShowLoginModal(true);
      return;
    }
    
    // User is authenticated - execute the action
    if (navigateTo) {
      navigate(navigateTo);
    } else if (onAuthenticatedClick) {
      onAuthenticatedClick();
    }
    // If neither is provided, let the original onClick bubble through
  };

  // Clone the child element and override its onClick
  const wrappedChild = isValidElement(children) 
    ? cloneElement(children as React.ReactElement<any>, {
        onClick: handleClick,
        // For Link components, prevent navigation for guests
        ...(isAuthenticated ? {} : { to: undefined }),
      })
    : children;

  return (
    <>
      {wrappedChild}
      <LoginPromptModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal}
        featureName={featureName}
      />
    </>
  );
}
