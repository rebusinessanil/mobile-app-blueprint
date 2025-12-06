import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

interface FormField {
  name: string;
  label: string;
  placeholder: string;
  optional?: boolean;
  type?: 'text' | 'number';
  maxLength?: number;
  showCounter?: boolean;
  prefix?: string;
}

interface BannerCreateLayoutProps {
  title: string;
  subtitle?: string;
  uplines: Upline[];
  onUplinesChange: (uplines: Upline[]) => void;
  formFields: FormField[];
  formData: Record<string, string>;
  onFormChange: (fieldName: string, value: string) => void;
  photo: string | null;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPhotoUpload?: boolean;
  onReset: () => void;
  onCreate: () => void;
  isProcessing?: boolean;
  children?: ReactNode;
}

export default function BannerCreateLayout({
  title,
  subtitle = "Achiever Details",
  uplines,
  onUplinesChange,
  formFields,
  formData,
  onFormChange,
  photo,
  onPhotoUpload,
  showPhotoUpload = true,
  onReset,
  onCreate,
  isProcessing = false,
  children
}: BannerCreateLayoutProps) {
  const navigate = useNavigate();

  // Ensure we always have 4 upline slots for display
  const displayUplines = [...uplines];
  while (displayUplines.length < 4) {
    displayUplines.push({
      id: `placeholder-${displayUplines.length}`,
      name: `Upline ${displayUplines.length + 1}`,
      avatar: undefined
    });
  }

  return (
    <div className="min-h-screen bg-black pb-6">
      {/* Header */}
      <header 
        className="sticky top-0 bg-black z-40 px-4 py-3"
        style={{
          borderBottom: '2px solid #FFD700',
          boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
        }}
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => !isProcessing && navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 
            className="text-2xl font-bold tracking-wider uppercase"
            style={{ 
              color: '#FFD700',
              fontFamily: 'Georgia, serif',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
            }}
          >
            {title}
          </h1>
          <button className="w-10 h-10 flex items-center justify-center">
            <div 
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
            >
              <span className="text-white/60 text-sm font-serif">i</span>
            </div>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Title Block with Medal and Decorations */}
        <div 
          className="relative overflow-hidden py-4 px-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,30,0.9) 100%)'
          }}
        >
          {/* Decorative teal/cyan curves on the right */}
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
            <svg 
              className="absolute top-0 right-0" 
              width="200" 
              height="120" 
              viewBox="0 0 200 120"
              style={{ opacity: 0.8 }}
            >
              <path 
                d="M200 0 Q150 30, 180 60 Q210 90, 160 120 L200 120 Z" 
                fill="url(#tealGrad1)"
              />
              <path 
                d="M200 20 Q160 50, 190 80 Q220 110, 180 120 L200 120 Z" 
                fill="url(#tealGrad2)"
              />
              <defs>
                <linearGradient id="tealGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00CED1" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#008B8B" stopOpacity="0.3"/>
                </linearGradient>
                <linearGradient id="tealGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#20B2AA" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#006666" stopOpacity="0.2"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Golden ribbon decoration at top-left */}
          <div className="absolute top-0 left-16 w-8 h-20 pointer-events-none">
            <svg width="40" height="80" viewBox="0 0 40 80">
              <path 
                d="M15 0 L15 50 L5 65 L15 55 L15 70 L25 55 L25 65 L15 50" 
                fill="url(#goldRibbon)"
              />
              <defs>
                <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#B8860B"/>
                  <stop offset="50%" stopColor="#FFD700"/>
                  <stop offset="100%" stopColor="#B8860B"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            {/* Bronze Medal Badge with Laurel Wreath */}
            <div className="w-24 h-28 flex-shrink-0 relative flex items-center justify-center">
              {/* Laurel wreath */}
              <svg className="absolute w-24 h-24" viewBox="0 0 100 100">
                {/* Left laurel */}
                <g fill="#B8860B" opacity="0.9">
                  <ellipse cx="25" cy="35" rx="8" ry="15" transform="rotate(-30 25 35)"/>
                  <ellipse cx="20" cy="50" rx="7" ry="13" transform="rotate(-20 20 50)"/>
                  <ellipse cx="18" cy="65" rx="6" ry="12" transform="rotate(-10 18 65)"/>
                  <ellipse cx="22" cy="78" rx="5" ry="10" transform="rotate(5 22 78)"/>
                </g>
                {/* Right laurel */}
                <g fill="#B8860B" opacity="0.9">
                  <ellipse cx="75" cy="35" rx="8" ry="15" transform="rotate(30 75 35)"/>
                  <ellipse cx="80" cy="50" rx="7" ry="13" transform="rotate(20 80 50)"/>
                  <ellipse cx="82" cy="65" rx="6" ry="12" transform="rotate(10 82 65)"/>
                  <ellipse cx="78" cy="78" rx="5" ry="10" transform="rotate(-5 78 78)"/>
                </g>
              </svg>
              {/* Medal circle */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                style={{
                  background: 'linear-gradient(145deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)',
                  boxShadow: '0 4px 15px rgba(205, 127, 50, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)'
                }}
              >
                <span 
                  className="text-3xl font-bold text-white"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  3
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 
                className="text-2xl font-bold mb-1"
                style={{ 
                  color: '#FFD700',
                  textShadow: '0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '2px'
                }}
              >
                PLEASE FILL UP
              </h2>
              <p 
                className="text-xl font-semibold"
                style={{ 
                  color: '#00CED1',
                  textShadow: '0 0 15px #00CED1, 0 0 30px #00CED1',
                  fontFamily: 'Georgia, serif'
                }}
              >
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Upline Section */}
        <div 
          className="rounded-2xl p-4"
          style={{
            border: '2px solid #FFD700',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.25), inset 0 0 20px rgba(255, 215, 0, 0.05)',
            background: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <div className="flex justify-between items-center px-2">
            {displayUplines.slice(0, 4).map((upline, index) => (
              <div key={upline.id} className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: '2.5px solid #FFD700',
                    boxShadow: '0 0 12px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(0,0,0,0.5)',
                    background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)'
                  }}
                >
                  {upline.avatar ? (
                    <img src={upline.avatar} alt={upline.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z"/>
                    </svg>
                  )}
                </div>
                <span 
                  className="text-xs font-medium"
                  style={{ color: '#FFD700' }}
                >
                  Upline {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form and Photo Section */}
        <div className="flex gap-3">
          {/* Left: Form Fields */}
          <div className="flex-1 space-y-3">
            {formFields.map((field) => (
              <div 
                key={field.name}
                className="rounded-xl p-3"
                style={{
                  border: '1.5px solid #FFD700',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.15)',
                  background: 'rgba(0, 0, 0, 0.4)'
                }}
              >
                <label className="text-sm text-white mb-2 block font-medium">
                  {field.label}
                  {field.optional && <span className="text-gray-500 ml-1 font-normal">(optional)</span>}
                </label>
                <div className="relative">
                  {field.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      {field.prefix}
                    </span>
                  )}
                  <Input 
                    value={formData[field.name] || ''} 
                    onChange={e => {
                      let value = e.target.value;
                      if (field.type === 'number') {
                        value = value.replace(/[^0-9]/g, '');
                      }
                      if (field.maxLength && value.length > field.maxLength) {
                        return;
                      }
                      onFormChange(field.name, value);
                    }} 
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={`bg-gray-900/60 border border-gray-700 text-white h-11 focus-visible:ring-1 focus-visible:ring-[#FFD700] focus-visible:border-[#FFD700] placeholder:text-gray-500 rounded-lg ${field.prefix ? 'pl-8' : ''}`}
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>
                {field.showCounter && field.maxLength && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {(formData[field.name] || '').length}/{field.maxLength} characters
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Right: Photo Upload */}
          {showPhotoUpload && (
            <div 
              className="w-36 flex-shrink-0 rounded-xl overflow-hidden relative"
              style={{
                border: '2px solid #FFD700',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                aspectRatio: '3/4',
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)'
              }}
            >
              {photo ? (
                <label className="relative w-full h-full block cursor-pointer">
                  <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                  <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                </label>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-end pb-4 cursor-pointer relative">
                  <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                  {/* Silhouette */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg 
                      className="w-full h-3/4" 
                      viewBox="0 0 100 140" 
                      fill="rgba(30, 30, 30, 0.9)"
                    >
                      {/* Head */}
                      <ellipse cx="50" cy="35" rx="22" ry="28" />
                      {/* Body/Shoulders */}
                      <path d="M10 140 Q10 95 50 85 Q90 95 90 140 Z" />
                    </svg>
                  </div>
                  {/* Camera icon and text */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="relative">
                      <Camera 
                        className="w-10 h-10" 
                        style={{ color: '#FFD700' }}
                        strokeWidth={1.5}
                      />
                      <Upload 
                        className="w-4 h-4 absolute -top-1 -right-1" 
                        style={{ color: '#FFD700' }}
                        strokeWidth={2}
                      />
                    </div>
                    <span 
                      className="text-xs font-medium text-center"
                      style={{ color: '#FFD700' }}
                    >
                      Upload Your Photo
                    </span>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onReset} 
            variant="outline" 
            className="flex-1 h-12 bg-black text-white hover:bg-gray-900 font-bold text-lg rounded-xl uppercase tracking-wider"
            disabled={isProcessing}
            style={{
              border: '2px solid #FFD700',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
            }}
          >
            RESET
          </Button>
          <Button 
            onClick={onCreate} 
            className="flex-1 h-12 text-black font-bold text-lg rounded-xl uppercase tracking-wider"
            disabled={isProcessing}
            style={{
              background: 'linear-gradient(180deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)'
            }}
          >
            CREATE
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}
