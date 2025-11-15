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
  photo: string | null;
  uplines: Array<{ id: string; name: string; avatar?: string }>;
}

export default function BannerPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const bannerData = location.state as BannerData;

  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Mock template variations (colors/gradients)
  const templateVariations = [
    { id: 0, name: "Original", bgColor: "from-pink-900 to-purple-900" },
    { id: 1, name: "Blue", bgColor: "from-blue-900 to-indigo-900" },
    { id: 2, name: "Green", bgColor: "from-emerald-900 to-teal-900" },
  ];

  // Mock grid templates (12 variations)
  const gridTemplates = Array(12).fill(null).map((_, i) => ({
    id: i,
    variant: i % 4,
  }));

  const handleDownload = () => {
    // TODO: Implement actual banner generation and download
    toast.success("Banner downloaded successfully!");
  };

  if (!bannerData) {
    navigate("/rank-selection");
    return null;
  }

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
        {/* Main Banner Preview - Square Format with Green Border */}
        <div className="relative">
          <div className="border-4 border-[#00FF00] rounded-2xl overflow-hidden shadow-2xl">
            <div className={`aspect-square bg-gradient-to-br ${templateVariations[selectedTemplate].bgColor} relative`}>
              {/* Company Logo Top Left */}
              <div className="absolute top-4 left-4 text-white">
                <div className="text-lg font-bold">Asclepius</div>
                <div className="text-xs">Empowering Wellness</div>
              </div>

              {/* Uplines Row - Top Center */}
              {bannerData.uplines.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {bannerData.uplines.slice(0, 5).map((upline, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-full gold-border overflow-hidden bg-secondary"
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
              <div className="absolute top-4 right-4 text-white text-right">
                <div className="text-lg font-bold">FIGHTER</div>
              </div>

              {/* Congratulations Text */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                  Congratulations!
                </h2>
                <p className="text-xl text-yellow-400 font-script italic">
                  Our Brand New Leader
                </p>
              </div>

              {/* User Photo - Left Side */}
              {bannerData.photo && (
                <div className="absolute left-8 top-32 w-48 h-56">
                  <img
                    src={bannerData.photo}
                    alt={bannerData.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Name Badge */}
              <div className="absolute top-36 right-8 bg-purple-800/90 rounded-2xl px-6 py-3 border-2 border-yellow-400">
                <p className="text-white font-bold text-lg text-center">
                  {bannerData.name.toUpperCase()}
                </p>
                <p className="text-sm text-yellow-200 text-center">
                  TEAM {bannerData.teamCity.toUpperCase()}
                </p>
              </div>

              {/* Rank Achievement */}
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center">
                <p className="text-2xl text-yellow-400 font-script italic mb-2">Achieved</p>
                <div className="text-7xl font-black text-yellow-500 drop-shadow-lg">
                  {bannerData.rankName.toUpperCase()}
                </div>
                <p className="text-3xl text-yellow-400 font-script italic mt-1">D's Rank</p>
              </div>

              {/* Ribbon Badge */}
              <div className="absolute bottom-48 left-12">
                <div className="text-6xl">🏆</div>
              </div>

              {/* Income Section */}
              <div className="absolute bottom-12 left-8 bg-purple-900/90 rounded-xl px-4 py-2 border-2 border-yellow-400">
                <p className="text-xs text-white">THIS WEEK INCOME QUALIFY FOR</p>
                <p className="text-3xl font-bold text-yellow-400">₹ 2,500/-</p>
              </div>

              {/* Bottom Right - Upline Info */}
              <div className="absolute bottom-8 right-8 text-right">
                <p className="text-lg text-yellow-400 font-script italic">Best Wishes</p>
                <p className="text-lg text-yellow-400 italic">FROM</p>
                <p className="text-xl font-bold text-white">MR. AJAY KUMAR GUPTA</p>
                <p className="text-sm text-yellow-200">BLUE DIAMOND AWPL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selection Row (3 options) */}
        <div className="flex gap-4 justify-center">
          {templateVariations.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-24 h-24 rounded-xl overflow-hidden transition-all ${
                selectedTemplate === template.id
                  ? "border-4 border-red-500 scale-105"
                  : "border-2 border-muted opacity-60 hover:opacity-100"
              }`}
            >
              <div className={`w-full h-full bg-gradient-to-br ${template.bgColor}`} />
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

        {/* Template Grid (4x3) */}
        <div className="grid grid-cols-4 gap-3 mt-8">
          {gridTemplates.map((template) => (
            <button
              key={template.id}
              className="aspect-square rounded-lg overflow-hidden border-2 border-yellow-500 hover:border-primary transition-all hover:scale-105"
            >
              <div
                className={`w-full h-full bg-gradient-to-br ${
                  template.variant === 0
                    ? "from-pink-900 to-purple-900"
                    : template.variant === 1
                    ? "from-red-900 to-pink-900"
                    : template.variant === 2
                    ? "from-purple-900 to-blue-900"
                    : "from-yellow-900 to-orange-900"
                } relative flex items-center justify-center`}
              >
                <div className="text-4xl">{bannerData.rankIcon}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
