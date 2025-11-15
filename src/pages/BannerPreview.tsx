import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import type { Sticker } from "@/hooks/useStickers";
interface BannerData {
  rankName: string;
  rankIcon: string;
  rankGradient: string;
  name: string;
  teamCity: string;
  chequeAmount?: string;
  photo: string | null;
  uplines: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  selectedStickers?: string[];
}
export default function BannerPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerData = location.state as BannerData;
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // Mock user ID - replace with actual auth when implemented
  const mockUserId = "mock-user-123";
  const {
    profile
  } = useProfile(mockUserId);

  // Use profile data for bottom section, fallback to banner data
  const displayName = profile?.name || bannerData?.name || "";
  const displayContact = profile?.mobile || profile?.whatsapp || "9876543210";
  const displayRank = profile?.rank || "Diamond";

  // Fetch selected stickers
  useEffect(() => {
    const fetchStickers = async () => {
      if (!bannerData?.selectedStickers || bannerData.selectedStickers.length === 0) {
        return;
      }
      const {
        data,
        error
      } = await supabase.from('stickers').select('*').in('id', bannerData.selectedStickers);
      if (!error && data) {
        setStickers(data);
      }
    };
    fetchStickers();
  }, [bannerData?.selectedStickers]);

  // Early return if no banner data
  if (!bannerData) {
    navigate("/rank-selection");
    return null;
  }

  // Mock profile photos (user uploaded photos)
  const profilePhotos = [bannerData.photo, bannerData.photo, bannerData.photo, bannerData.photo].filter(Boolean);

  // Template color variations with different backgrounds
  const templateColors = [{
    id: 0,
    name: "Purple Pink",
    bgColor: "from-pink-900 to-purple-900"
  }, {
    id: 1,
    name: "Blue Indigo",
    bgColor: "from-blue-900 to-indigo-900"
  }, {
    id: 2,
    name: "Emerald Teal",
    bgColor: "from-emerald-900 to-teal-900"
  }, {
    id: 3,
    name: "Red Pink",
    bgColor: "from-red-900 to-pink-900"
  }, {
    id: 4,
    name: "Purple Blue",
    bgColor: "from-purple-900 to-blue-900"
  }, {
    id: 5,
    name: "Orange Yellow",
    bgColor: "from-yellow-900 to-orange-900"
  }];
  const handleDownload = () => {
    // TODO: Implement actual banner generation and download
    toast.success("Banner downloaded successfully!");
  };
  return <div className="min-h-screen bg-navy-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-wider">BANNER PREVIEW</h1>
          <button className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Main Banner Preview - Fixed Square Format (1080x1080 base) */}
        <div className="relative w-full max-w-[600px] mx-auto">
          <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-2xl">
            {/* Fixed aspect ratio container - scales proportionally on all devices */}
            <div className={`relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`} style={{
            paddingBottom: '100%'
          }}>
              <div className="absolute inset-0">
                
                {/* Left Side - Main Achievement Photo */}
                {bannerData.photo && <div className="absolute overflow-hidden shadow-2xl" style={{
                left: '2%',
                top: '8%',
                width: '42%',
                height: '65%'
              }}>
                    <img src={bannerData.photo} alt={bannerData.name} className="w-full h-full object-cover" />
                  </div>}

                {/* Right Side - Name and Team */}
                <div className="absolute" style={{
                top: '20%',
                right: '6%',
                width: '48%'
              }}>
                  <h2 className="text-white font-black leading-none tracking-wider text-right" style={{
                  fontSize: 'clamp(32px,6.5vw,68px)',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
                    {bannerData.name.toUpperCase()}
                  </h2>
                  <p className="text-white font-bold text-right mt-2 tracking-widest" style={{
                  fontSize: 'clamp(16px,3vw,32px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                    TEMA - {bannerData.teamCity.toUpperCase()}
                  </p>
                </div>

                {/* Achievement Stickers - Dynamic from Selection */}
                {stickers.length > 0 && <div className="absolute flex gap-[2%]" style={{
                bottom: '33%',
                left: '2%',
                width: '44%'
              }}>
                    {stickers.map((sticker, index) => <div key={sticker.id} className="rounded-full border-[5px] border-yellow-400 overflow-hidden shadow-xl" style={{
                  width: '30%',
                  aspectRatio: '1/1'
                }}>
                        <img src={sticker.image_url} alt={sticker.name} className="w-full h-full object-cover" />
                      </div>)}
                  </div>}

                {/* Income Section - Bottom Left */}
                {bannerData.chequeAmount && <div className="absolute" style={{
                bottom: '16%',
                left: '2%',
                width: '55%'
              }}>
                    <p style={{
                  fontSize: 'clamp(10px,1.8vw,16px)',
                  letterSpacing: '0.1em'
                }} className="text-white leading-tight mb-1 text-xs font-thin text-left my-0 px-0 py-0 mx-0">
                      THIS WEEK INCOME 
                    </p>
                    <p className="font-black leading-none" style={{
                  fontSize: 'clamp(48px,9vw,90px)',
                  color: '#FFFFFF',
                  textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
                  letterSpacing: '0.02em'
                }}>
                      {Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                    </p>
                  </div>}

                {/* Bottom Right - Profile Photo (Auto-Sync from Profile) */}
                <div className="absolute overflow-hidden shadow-2xl" style={{
                bottom: '8%',
                right: '3%',
                width: '32%',
                height: '38%'
              }}>
                  <img src={profile?.profile_photo || bannerData.photo || "/placeholder.svg"} alt={displayName} className="w-full h-full object-cover" />
                </div>

                {/* Bottom Right - Profile Name and Rank (Auto-Sync) */}
                <div style={{
                bottom: '48%',
                right: '3%',
                width: '32%'
              }} className="absolute text-center mx-[240px] py-[40px] px-0 my-[240px]">
                  <p style={{
                  fontSize: 'clamp(14px,2.5vw,24px)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }} className="text-white font-bold leading-tight tracking-wide mx-0">
                    {displayName.toUpperCase()}
                  </p>
                  <p style={{
                  fontSize: 'clamp(10px,1.8vw,16px)',
                  color: '#FFD700',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }} className="font-semibold leading-tight mt-1 text-xs">
                    {displayRank.toUpperCase()}
                  </p>
                </div>

                {/* Bottom Left - Contact Info (Auto-Sync from Profile) */}
                <div className="absolute" style={{
                bottom: '3%',
                left: '2%'
              }}>
                  <p style={{
                  fontSize: 'clamp(14px,2.5vw,22px)',
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }} className="font-bold leading-tight px-0 py-0 text-xs mx-[5px] my-0">
                    +91 {displayContact}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Profile Photos Row */}
        {profilePhotos.length > 0 && <div className="flex gap-3 justify-center overflow-x-auto pb-2">
            {profilePhotos.map((photo, idx) => <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/50 flex-shrink-0">
                <img src={photo!} alt={`Profile ${idx + 1}`} className="w-full h-full object-cover" />
              </div>)}
          </div>}

        {/* Template Color Selection Grid */}
        <div className="grid grid-cols-3 gap-4">
          {templateColors.map(template => <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`aspect-square rounded-2xl overflow-hidden transition-all relative ${selectedTemplate === template.id ? "border-4 border-[#00FF00] scale-105 shadow-lg shadow-[#00FF00]/30" : "border-2 border-muted/30 hover:border-primary/50"}`}>
              <div className={`w-full h-full bg-gradient-to-br ${template.bgColor} flex items-center justify-center`}>
                <div className="text-5xl">💚</div>
              </div>
            </button>)}
        </div>

        {/* Download Button */}
        <div className="flex justify-center">
          <Button onClick={handleDownload} className="h-16 px-12 bg-teal-600 hover:bg-teal-700 text-white text-xl font-bold rounded-2xl flex items-center gap-3">
            <Download className="w-6 h-6" />
            DOWNLOAD
          </Button>
        </div>

      </div>
    </div>;
}