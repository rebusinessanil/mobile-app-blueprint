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
          <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-2xl">
            {/* Fixed aspect ratio container - scales proportionally on all devices */}
            <div className={`relative w-full bg-gradient-to-br ${templateColors[selectedTemplate].bgColor}`} style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0">
                
                {/* Company Logo Top Left */}
                <div className="absolute text-white" style={{ top: '3%', left: '3%' }}>
                  <div className="text-[clamp(14px,2.2vw,20px)] font-bold leading-tight">Asclepius</div>
                  <div className="text-[clamp(9px,1.2vw,12px)] leading-tight opacity-90">Empowering Wellness</div>
                </div>

                {/* Uplines Row - Top Center */}
                {bannerData.uplines.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 flex gap-[1.5%]" style={{ top: '3%' }}>
                    {bannerData.uplines.slice(0, 9).map((upline, idx) => (
                      <div
                        key={idx}
                        className="rounded-full border-[3px] border-yellow-400 overflow-hidden bg-secondary"
                        style={{ width: '7%', aspectRatio: '1/1' }}
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

                {/* Company Logo Top Right */}
                <div className="absolute text-white text-right" style={{ top: '3%', right: '3%' }}>
                  <div className="text-[clamp(14px,2.2vw,20px)] font-bold leading-tight">FIGHTER</div>
                  <div className="text-[clamp(9px,1.2vw,12px)] leading-tight opacity-90">SUCCESS SYSTEM</div>
                </div>

                {/* Confetti Decoration */}
                <div className="absolute" style={{ top: '15%', left: '30%', right: '30%' }}>
                  <div className="flex justify-center gap-1">
                    {['🎊', '🎉', '✨', '🎈', '🎊'].map((emoji, i) => (
                      <span key={i} className="text-[clamp(12px,2vw,20px)] animate-pulse">{emoji}</span>
                    ))}
                  </div>
                </div>

                {/* Congratulations Text */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '17%', width: '85%' }}>
                  <h2 className="text-[clamp(24px,5vw,40px)] font-extrabold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-1 leading-none">
                    Congratulations!
                  </h2>
                  <p className="text-[clamp(16px,2.8vw,24px)] text-yellow-300 italic leading-tight mt-2" style={{ fontFamily: 'cursive' }}>
                    Our Brand New Leader
                  </p>
                </div>

                {/* User Photo - Left Side with proper positioning */}
                {bannerData.photo && (
                  <div className="absolute rounded-lg overflow-hidden shadow-2xl" style={{ 
                    left: '5%', 
                    top: '32%', 
                    width: '38%', 
                    height: '45%' 
                  }}>
                    <img
                      src={bannerData.photo}
                      alt={bannerData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Trophy/Ribbon Sticker - overlays on photo */}
                <div className="absolute" style={{ bottom: '45%', left: '3%', width: '18%' }}>
                  <div className="text-[clamp(40px,7vw,80px)] drop-shadow-lg">🏆</div>
                </div>

                {/* Name Badge - Top Right Area */}
                <div 
                  className="absolute bg-fuchsia-700/95 rounded-3xl px-5 py-3 border-[3px] border-yellow-400 shadow-xl"
                  style={{ top: '35%', right: '5%', maxWidth: '48%' }}
                >
                  <p className="text-white font-black text-[clamp(13px,2.2vw,18px)] text-center leading-tight tracking-wide">
                    {bannerData.name.toUpperCase()}
                  </p>
                  <p className="text-[clamp(10px,1.5vw,13px)] text-yellow-200 text-center leading-tight mt-1 font-medium">
                    TEAM {bannerData.teamCity.toUpperCase()}
                  </p>
                </div>

                {/* Team Location Label */}
                <div className="absolute text-center" style={{ top: '47%', right: '5%', maxWidth: '48%' }}>
                  <p className="text-[clamp(11px,1.8vw,16px)] text-yellow-300 font-bold leading-tight tracking-wider">
                    {bannerData.teamCity.toUpperCase()} FIGHTER
                  </p>
                </div>

                {/* Rank Achievement - Large Text */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '52%', width: '90%' }}>
                  <p className="text-[clamp(18px,3vw,28px)] text-yellow-300 italic mb-1 leading-tight" style={{ fontFamily: 'cursive' }}>
                    Achieved
                  </p>
                  <div 
                    className="font-black text-yellow-400 drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)] leading-none tracking-tighter"
                    style={{ 
                      fontSize: 'clamp(48px,10vw,90px)',
                      textShadow: '4px 4px 0 rgba(0,0,0,0.5), -2px -2px 0 rgba(255,215,0,0.3)'
                    }}
                  >
                    {bannerData.rankName.toUpperCase()}
                  </div>
                  <p className="text-[clamp(20px,3.5vw,32px)] text-yellow-300 italic mt-1 leading-tight" style={{ fontFamily: 'cursive' }}>
                    D's Rank
                  </p>
                </div>

                {/* Income Section - Bottom Left */}
                {bannerData.chequeAmount && (
                  <div 
                    className="absolute bg-fuchsia-800/95 rounded-2xl px-4 py-2 border-[3px] border-yellow-400 shadow-xl"
                    style={{ bottom: '8%', left: '5%', maxWidth: '48%' }}
                  >
                    <p className="text-[clamp(8px,1.3vw,11px)] text-white font-bold leading-tight tracking-wide">
                      THIS WEEK INCOME QUALIFY FOR
                    </p>
                    <p className="text-[clamp(20px,4vw,36px)] font-black text-yellow-300 leading-tight mt-1">
                      ₹ {Number(bannerData.chequeAmount).toLocaleString('en-IN')}/-
                    </p>
                  </div>
                )}

                {/* Bottom Right - Mentor Photo & Info */}
                {bannerData.uplines.length > 0 && (
                  <>
                    {/* Mentor Photo */}
                    <div 
                      className="absolute rounded-lg overflow-hidden border-[3px] border-yellow-400 shadow-xl"
                      style={{ bottom: '8%', right: '5%', width: '22%', height: '28%' }}
                    >
                      {bannerData.uplines[0].avatar ? (
                        <img 
                          src={bannerData.uplines[0].avatar} 
                          alt={bannerData.uplines[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/30" />
                      )}
                    </div>

                    {/* Mentor Info Text */}
                    <div className="absolute text-center" style={{ bottom: '38%', right: '5%', maxWidth: '45%' }}>
                      <p className="text-[clamp(12px,2vw,18px)] text-yellow-300 italic leading-tight" style={{ fontFamily: 'cursive' }}>
                        Best Wishes
                      </p>
                      <p className="text-[clamp(11px,1.8vw,16px)] text-yellow-200 italic leading-tight font-medium">
                        FROM
                      </p>
                      <p className="text-[clamp(12px,2.2vw,18px)] font-bold text-white leading-tight mt-1 tracking-wide">
                        {bannerData.uplines[0].name.toUpperCase()}
                      </p>
                      <p className="text-[clamp(9px,1.5vw,13px)] text-yellow-200 leading-tight font-medium">
                        BLUE DIAMOND AWPL
                      </p>
                    </div>
                  </>
                )}

                {/* Contact Info - Bottom Center/Left */}
                <div 
                  className="absolute flex items-center gap-2 bg-blue-900/80 rounded-xl px-3 py-2 border-2 border-yellow-400"
                  style={{ bottom: '1.5%', left: '3%' }}
                >
                  <span className="text-[clamp(16px,3vw,24px)]">📞</span>
                  <div>
                    <p className="text-[clamp(7px,1vw,9px)] text-white leading-none">FOR SUCCESS CALL ON</p>
                    <p className="text-[clamp(10px,1.6vw,14px)] font-bold text-yellow-300 leading-tight">
                      +91 7856891547
                    </p>
                  </div>
                </div>

                {/* Social Media Icons - Bottom Right */}
                <div className="absolute flex gap-1" style={{ bottom: '1.5%', right: '28%' }}>
                  {['📘', '📷', '▶️', '💬'].map((icon, i) => (
                    <div key={i} className="text-[clamp(12px,2vw,16px)]">{icon}</div>
                  ))}
                  <span className="text-[clamp(8px,1.3vw,11px)] text-yellow-200 font-medium ml-1">
                    /AJAY KUMAR GUPTA
                  </span>
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
