import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Award, Wallet } from "lucide-react";

interface UserInfo {
  name: string;
  role: string | null;
  mobile: string;
  balance: number;
}

export default function AdminUserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user data
  const fetchUserData = async (uid: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role, mobile')
        .eq('user_id', uid)
        .single();

      // Fetch wallet balance
      const { data: credits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', uid)
        .single();

      if (profile) {
        setUserInfo({
          name: profile.name || 'Admin',
          role: profile.role,
          mobile: profile.mobile || '',
          balance: credits?.balance || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchUserData(user.id);
      }
    };
    getUser();
  }, []);

  // Real-time subscription for profile changes
  useEffect(() => {
    if (!userId) return;

    const profileChannel = supabase
      .channel(`admin-profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUserData(userId);
        }
      )
      .subscribe();

    const creditsChannel = supabase
      .channel(`admin-credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUserData(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(creditsChannel);
    };
  }, [userId]);

  if (!userInfo) {
    return (
      <div className="p-4 bg-card/50 rounded-lg border border-primary/20 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
        <div className="h-3 bg-muted rounded w-32"></div>
      </div>
    );
  }

  // Format mobile for display
  const formatMobile = (mobile: string) => {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
    }
    return mobile;
  };

  return (
    <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/30 space-y-3">
      <div className="flex items-center gap-2 text-foreground">
        <User className="w-4 h-4 text-primary" />
        <span className="font-semibold">{userInfo.name}</span>
      </div>
      
      {userInfo.role && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Award className="w-4 h-4 text-primary/70" />
          <span className="capitalize">{userInfo.role.replace(/-/g, ' ')}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Phone className="w-4 h-4 text-primary/70" />
        <span className="font-mono">{formatMobile(userInfo.mobile)}</span>
      </div>
      
      <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-primary font-bold">₹{userInfo.balance.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">Balance</span>
      </div>
    </div>
  );
}
