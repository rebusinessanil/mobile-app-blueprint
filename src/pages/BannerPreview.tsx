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
                <div className="absolute text-white" style={{ top: '2.5%', left: '2.5%' }}>
                  <div className="text-[clamp(16px,2.5vw,22px)] font-bold leading-tight tracking-wide">Asclepius</div>
                  <div className="text-[clamp(9px,1.3vw,13px)] leading-tight opacity-90">Empowering Wellness</div>
                </div>

                {/* Congratulations Text */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '11%', width: '90%' }}>
                  <h2 
                    className="font-black leading-none tracking-tight mb-2"
                    style={{ 
                      fontSize: 'clamp(36px,7.5vw,70px)',
                      color: '#333',
                      textShadow: '2px 2px 0 rgba(255,255,255,0.3), -1px -1px 0 rgba(0,0,0,0.8)',
                      WebkitTextStroke: '1px rgba(255,255,255,0.1)'
                    }}
                  >
                    Congratulations!
                  </h2>
                  <p className="text-[clamp(18px,3.2vw,28px)] italic leading-tight opacity-80" style={{ fontFamily: 'cursive', color: '#888' }}>
                    Our Brand New Leader
                  </p>
                </div>

                {/* User Photo - Left Side */}
                {bannerData.photo && (
                  <div className="absolute rounded-lg overflow-hidden shadow-2xl" style={{ 
                    left: '4%', 
                    top: '25%', 
                    width: '40%', 
                    height: '50%' 
                  }}>
                    <img
                      src={bannerData.photo}
                      alt={bannerData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Name Badge - Center Right */}
                <div 
                  className="absolute rounded-2xl px-6 py-4 shadow-2xl"
                  style={{ 
                    top: '28%', 
                    right: '8%', 
                    maxWidth: '50%',
                    background: 'linear-gradient(135deg, #7e1a3d 0%, #4a0e23 100%)',
                    border: '3px solid #FFD700'
                  }}
                >
                  <p className="text-white font-black text-[clamp(16px,3vw,26px)] text-center leading-tight tracking-widest">
                    {bannerData.name.toUpperCase()}
                  </p>
                  <p className="text-[clamp(11px,1.8vw,16px)] text-yellow-200 text-center leading-tight mt-2 font-semibold tracking-wide">
                    TEMA - {bannerData.teamCity.toUpperCase()}
                  </p>
                </div>

                {/* Achieved Text */}
                <div className="absolute text-center" style={{ top: '44%', right: '8%', maxWidth: '50%' }}>
                  <p className="text-[clamp(16px,2.8vw,24px)] italic leading-tight opacity-70" style={{ fontFamily: 'cursive', color: '#d4af37' }}>
                    Achieved
                  </p>
                </div>

                {/* Rank Achievement - Large Embossed Text */}
                <div className="absolute text-center" style={{ top: '48%', right: '5%', width: '55%' }}>
                  <div 
                    className="font-black leading-none tracking-tighter"
                    style={{ 
                      fontSize: 'clamp(42px,8.5vw,85px)',
                      color: '#2a1810',
                      textShadow: `
                        3px 3px 0 rgba(0,0,0,0.8),
                        -1px -1px 0 rgba(255,215,0,0.2),
                        0 0 20px rgba(0,0,0,0.5)
                      `,
                      WebkitTextStroke: '1px rgba(0,0,0,0.5)',
                      letterSpacing: '-0.03em'
                    }}
                  >
                    {bannerData.rankName.toUpperCase()}
                  </div>
                  <div className="text-[clamp(18px,3.2vw,30px)] font-bold leading-tight mt-1" style={{ color: '#2a1810' }}>
                    DS RANK
                  </div>
                </div>

                {/* Trip/Achievement Info */}
                <div className="absolute text-center" style={{ top: '65%', right: '5%', width: '55%' }}>
                  <p className="text-[clamp(14px,2.5vw,24px)] font-bold leading-tight tracking-wide" style={{ color: '#d4af37' }}>
                    & ANDAMAN NICOBAR ISLAND
                  </p>
                  <p className="text-[clamp(11px,1.8vw,18px)] italic leading-tight mt-1 opacity-80" style={{ fontFamily: 'cursive', color: '#888' }}>
                    Trip With Couple / Child
                  </p>
                </div>

                {/* Achievement Stickers - Circular Images Bottom Left */}
                <div className="absolute flex gap-[2%]" style={{ bottom: '30%', left: '4%', width: '42%' }}>
                  {/* First circular sticker */}
                  <div 
                    className="rounded-full border-[4px] border-yellow-400 overflow-hidden bg-blue-400 shadow-xl"
                    style={{ width: '30%', aspectRatio: '1/1' }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-end justify-center p-2">
                      <span className="text-[clamp(8px,1.5vw,14px)] font-bold text-white italic" style={{ fontFamily: 'cursive' }}>Andaman</span>
                    </div>
                  </div>
                  {/* Second circular sticker */}
                  <div 
                    className="rounded-full border-[4px] border-yellow-400 overflow-hidden bg-green-500 shadow-xl"
                    style={{ width: '30%', aspectRatio: '1/1' }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600" />
                  </div>
                  {/* Third circular sticker */}
                  <div 
                    className="rounded-full border-[4px] border-yellow-400 overflow-hidden bg-cyan-400 shadow-xl"
                    style={{ width: '30%', aspectRatio: '1/1' }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-cyan-300 to-cyan-500" />
                  </div>
                </div>

                {/* Income Section - Bottom Left with Arrow Design */}
                {bannerData.chequeAmount && (
                  <div className="absolute" style={{ bottom: '11%', left: '4%' }}>
                    {/* Arrow-shaped background */}
                    <div 
                      className="relative px-6 py-3 shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #8b0000 0%, #5a0000 100%)',
                        clipPath: 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)',
                        minWidth: '280px'
                      }}
                    >
                      <p className="text-[clamp(7px,1.1vw,10px)] text-white font-bold leading-tight tracking-wider">
                        THIS WEEK INCOME QUALIFY FOR
                      </p>
                      <p className="text-[clamp(28px,5.5vw,52px)] font-black leading-tight mt-1" style={{ 
                        color: '#d4af37',
                        textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
                      }}>
                        ₹{Number(bannerData.chequeAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Right - Mentor Photo */}
                {bannerData.uplines.length > 0 && (
                  <>
                    <div 
                      className="absolute rounded-lg overflow-hidden shadow-2xl"
                      style={{ bottom: '11%', right: '4%', width: '24%', height: '30%' }}
                    >
                      {bannerData.uplines[0].avatar ? (
                        <img 
                          src={bannerData.uplines[0].avatar} 
                          alt={bannerData.uplines[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700" />
                      )}
                    </div>

                    {/* Mentor Info - Above Photo */}
                    <div className="absolute text-center" style={{ bottom: '43%', right: '4%', width: '24%' }}>
                      <p className="text-[clamp(13px,2.2vw,20px)] italic leading-tight" style={{ fontFamily: 'cursive', color: '#d4af37' }}>
                        Best Wishes
                      </p>
                      <p className="text-[clamp(10px,1.6vw,14px)] italic leading-tight font-medium" style={{ color: '#888' }}>
                        FROM
                      </p>
                      <p className="text-[clamp(12px,2.2vw,18px)] font-bold text-white leading-tight mt-1 tracking-wide">
                        {bannerData.uplines[0].name.toUpperCase()}
                      </p>
                      <p className="text-[clamp(9px,1.5vw,13px)] leading-tight font-semibold mt-1" style={{ color: '#d4af37' }}>
                        ROYAL AMBASSADOR
                      </p>
                    </div>
                  </>
                )}

                {/* Contact Info - Bottom Left */}
                <div 
                  className="absolute flex items-center gap-2 rounded-xl px-4 py-2"
                  style={{ bottom: '2%', left: '4%', background: 'rgba(0,0,0,0.7)' }}
                >
                  <span className="text-[clamp(14px,2.5vw,20px)]">📞</span>
                  <div>
                    <p className="text-[clamp(6px,0.9vw,8px)] text-white leading-none opacity-80">FOR SUCCESS CALL ON</p>
                    <p className="text-[clamp(11px,1.8vw,16px)] font-bold leading-tight" style={{ color: '#d4af37' }}>
                      +91 7856891547
                    </p>
                  </div>
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
