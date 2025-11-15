import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BannerData {
  rankName: string;
  rankIcon: string;
  rankGradient: string;
  name: string;
  teamCity: string;
  chequeAmount?: string;
  photo: string | null;
  uplines: Array<{ id: string; name: string; avatar?: string }>;
}

export default function BannerPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerData = location.state as BannerData;

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Early return if no banner data
  if (!bannerData) {
    navigate("/rank-selection");
    return null;
  }

  // Mock profile photos (user uploaded photos)
  const profilePhotos = [
    bannerData.photo,
    bannerData.photo,
    bannerData.photo,
    bannerData.photo,
  ].filter(Boolean);

  // Template color variations with different backgrounds
  const templateColors = [
    { id: 0, name: "Purple Pink", bgColor: "from-pink-900 to-purple-900" },
    { id: 1, name: "Blue Indigo", bgColor: "from-blue-900 to-indigo-900" },
    { id: 2, name: "Emerald Teal", bgColor: "from-emerald-900 to-teal-900" },
    { id: 3, name: "Red Pink", bgColor: "from-red-900 to-pink-900" },
    { id: 4, name: "Purple Blue", bgColor: "from-purple-900 to-blue-900" },
    { id: 5, name: "Orange Yellow", bgColor: "from-yellow-900 to-orange-900" },
  ];

  const handleDownload = () => {
    // TODO: Implement actual banner generation and download
    toast.success("Banner downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-white flex items-center justify-center hover:bg-white/10 transition-colors"
          >
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
          <div className="border-4 border-[#00FF00] rounded-2xl overflow-hidden shadow-2xl">
            {/* Fixed aspect ratio container - scales proportionally on all devices */}
            <div className={`relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`} style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0">
                {/* All elements use percentage-based positioning for cross-device consistency */}
                
                {/* Company Logo Top Left - 4% from top/left */}
                <div className="absolute text-white" style={{ top: '4%', left: '4%' }}>
                  <div className="text-[clamp(14px,2vw,18px)] font-bold leading-tight">Asclepius</div>
                  <div className="text-[clamp(10px,1.2vw,12px)] leading-tight">Empowering Wellness</div>
                </div>

                {/* Uplines Row - Top Center - 4% from top */}
                {bannerData.uplines.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 flex gap-2" style={{ top: '4%' }}>
                    {bannerData.uplines.slice(0, 5).map((upline, idx) => (
                      <div
                        key={idx}
                        className="rounded-full gold-border overflow-hidden bg-secondary"
                        style={{ width: '8%', aspectRatio: '1/1' }}
                      >
                        {upline.avatar ? (
                          <img src={upline.avatar} alt={upline.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Company Logo Top Right - 4% from top/right */}
                <div className="absolute text-white text-right" style={{ top: '4%', right: '4%' }}>
                  <div className="text-[clamp(14px,2vw,18px)] font-bold leading-tight">FIGHTER</div>
                </div>

                {/* Congratulations Text - 18% from top */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '18%', width: '80%' }}>
                  <h2 className="text-[clamp(20px,4vw,32px)] font-bold text-white drop-shadow-lg mb-1 leading-tight">
                    Congratulations!
                  </h2>
                  <p className="text-[clamp(14px,2.5vw,20px)] text-yellow-400 font-script italic leading-tight">
                    Our Brand New Leader
                  </p>
                </div>

                {/* User Photo - Left Side - positioned at 30% from top, 7% from left */}
                {bannerData.photo && (
                  <div className="absolute rounded-lg overflow-hidden" style={{ 
                    left: '7%', 
                    top: '30%', 
                    width: '40%', 
                    height: '48%' 
                  }}>
                    <img
                      src={bannerData.photo}
                      alt={bannerData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Name Badge - positioned at 33% from top, 52% from left */}
                <div 
                  className="absolute bg-purple-800/90 rounded-2xl px-4 py-2 border-2 border-yellow-400"
                  style={{ top: '33%', right: '7%', maxWidth: '45%' }}
                >
                  <p className="text-white font-bold text-[clamp(12px,2vw,16px)] text-center leading-tight">
                    {bannerData.name.toUpperCase()}
                  </p>
                  <p className="text-[clamp(10px,1.5vw,13px)] text-yellow-200 text-center leading-tight mt-1">
                    TEAM {bannerData.teamCity.toUpperCase()}
                  </p>
                </div>

                {/* Rank Achievement - centered at 60% from top */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ bottom: '28%', width: '90%' }}>
                  <p className="text-[clamp(14px,2.5vw,22px)] text-yellow-400 font-script italic mb-1 leading-tight">Achieved</p>
                  <div className="text-[clamp(32px,8vw,64px)] font-black text-yellow-500 drop-shadow-lg leading-tight">
                    {bannerData.rankName.toUpperCase()}
                  </div>
                  <p className="text-[clamp(16px,3.5vw,28px)] text-yellow-400 font-script italic mt-1 leading-tight">D's Rank</p>
                </div>

                {/* Ribbon Badge - 42% from bottom, 10% from left */}
                <div className="absolute" style={{ bottom: '42%', left: '10%' }}>
                  <div className="text-[clamp(32px,6vw,56px)]">🏆</div>
                </div>

                {/* Income Section - 10% from bottom/left */}
                <div 
                  className="absolute bg-purple-900/90 rounded-xl px-3 py-2 border-2 border-yellow-400"
                  style={{ bottom: '10%', left: '7%', maxWidth: '42%' }}
                >
                  <p className="text-[clamp(8px,1.2vw,10px)] text-white leading-tight">THIS WEEK INCOME QUALIFY FOR</p>
                  <p className="text-[clamp(16px,3.5vw,28px)] font-bold text-yellow-400 leading-tight mt-1">
                    ₹ {bannerData.chequeAmount ? Number(bannerData.chequeAmount).toLocaleString('en-IN') : '2,500'}/-
                  </p>
                </div>

                {/* Bottom Right - Upline Info - 7% from bottom/right */}
                <div className="absolute text-right" style={{ bottom: '7%', right: '7%', maxWidth: '45%' }}>
                  <p className="text-[clamp(12px,2vw,16px)] text-yellow-400 font-script italic leading-tight">Best Wishes</p>
                  <p className="text-[clamp(12px,2vw,16px)] text-yellow-400 italic leading-tight">FROM</p>
                  <p className="text-[clamp(13px,2.2vw,18px)] font-bold text-white leading-tight mt-1">MR. AJAY KUMAR GUPTA</p>
                  <p className="text-[clamp(10px,1.5vw,13px)] text-yellow-200 leading-tight">BLUE DIAMOND AWPL</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Photos Row */}
        {profilePhotos.length > 0 && (
          <div className="flex gap-3 justify-center overflow-x-auto pb-2">
            {profilePhotos.map((photo, idx) => (
              <div
                key={idx}
                className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/50 flex-shrink-0"
              >
                <img
                  src={photo!}
                  alt={`Profile ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Template Color Selection Grid */}
        <div className="grid grid-cols-3 gap-4">
          {templateColors.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`aspect-square rounded-2xl overflow-hidden transition-all relative ${
                selectedTemplate === template.id
                  ? "border-4 border-[#00FF00] scale-105 shadow-lg shadow-[#00FF00]/30"
                  : "border-2 border-muted/30 hover:border-primary/50"
              }`}
            >
              <div className={`w-full h-full bg-gradient-to-br ${template.bgColor} flex items-center justify-center`}>
                <div className="text-5xl">💚</div>
              </div>
            </button>
          ))}
        </div>

        {/* Download Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleDownload}
            className="h-16 px-12 bg-teal-600 hover:bg-teal-700 text-white text-xl font-bold rounded-2xl flex items-center gap-3"
          >
            <Download className="w-6 h-6" />
            DOWNLOAD
          </Button>
        </div>

      </div>
    </div>
  );
}
