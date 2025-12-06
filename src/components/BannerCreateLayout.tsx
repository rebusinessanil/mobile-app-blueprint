import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Camera } from "lucide-react";
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

  const handleAddUpline = () => {
    if (uplines.length < 4) {
      const newUpline: Upline = {
        id: `upline-${Date.now()}`,
        name: `Upline ${uplines.length + 1}`,
        avatar: undefined
      };
      onUplinesChange([...uplines, newUpline]);
    }
  };

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
      <header className="sticky top-0 bg-black z-40 px-4 py-3 border-b-2 border-[#FFD700]">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => !isProcessing && navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-[#FFD700] tracking-wider uppercase" style={{ fontFamily: 'serif' }}>
            {title}
          </h1>
          <button className="w-10 h-10 flex items-center justify-center">
            <Info className="w-6 h-6 text-white/70" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Title Block with Badge */}
        <div className="relative overflow-hidden rounded-lg py-4">
          {/* Decorative curves */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#FFD700]/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-48 h-24 bg-gradient-to-l from-cyan-500/20 to-transparent" />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            {/* Bronze Medal Badge */}
            <div className="w-24 h-24 flex-shrink-0 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Golden laurel wreath effect */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CD7F32] via-[#B87333] to-[#8B4513] flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
                  <span className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>3</span>
                </div>
              </div>
              {/* Decorative ribbon */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-gradient-to-r from-[#8B0000] via-[#DC143C] to-[#8B0000] rounded-b-lg" />
            </div>
            
            <div className="flex-1">
              <h2 
                className="text-2xl font-bold text-[#FFD700] mb-1"
                style={{ 
                  textShadow: '0 0 20px #FFD700, 0 0 40px #FFD700',
                  fontFamily: 'serif'
                }}
              >
                PLEASE FILL UP
              </h2>
              <p 
                className="text-xl font-semibold text-cyan-400"
                style={{ 
                  textShadow: '0 0 15px #00FFFF, 0 0 30px #00FFFF'
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
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 15px rgba(255, 215, 0, 0.1)'
          }}
        >
          <div className="flex justify-between items-center">
            {displayUplines.slice(0, 4).map((upline, index) => (
              <div key={upline.id} className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden"
                  style={{
                    border: '2px solid #FFD700',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)'
                  }}
                >
                  {upline.avatar ? (
                    <img src={upline.avatar} alt={upline.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-[#FFD700] font-medium">Upline {index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form and Photo Section */}
        <div className="flex gap-4">
          {/* Left: Form Fields */}
          <div className="flex-1 space-y-4">
            {formFields.map((field) => (
              <div 
                key={field.name}
                className="rounded-xl p-3"
                style={{
                  border: '1px solid #FFD700',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
                }}
              >
                <label className="text-sm text-white mb-2 block">
                  {field.label}
                  {field.optional && <span className="text-gray-500 ml-1">(optional)</span>}
                </label>
                <div className="relative">
                  {field.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                    className={`bg-gray-900/50 border-0 text-white h-11 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-600 rounded-lg ${field.prefix ? 'pl-8' : ''}`}
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
              className="w-40 flex-shrink-0 rounded-xl overflow-hidden"
              style={{
                border: '2px solid #FFD700',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                aspectRatio: '3/4'
              }}
            >
              {photo ? (
                <label className="relative w-full h-full block cursor-pointer">
                  <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                  <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                </label>
              ) : (
                <label className="w-full h-full bg-gray-900 flex flex-col items-center justify-end pb-6 cursor-pointer relative">
                  <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                  {/* Silhouette */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-32 h-40 text-gray-800" viewBox="0 0 100 120" fill="currentColor">
                      <ellipse cx="50" cy="35" rx="25" ry="30" />
                      <path d="M10 120 Q10 80 50 70 Q90 80 90 120 Z" />
                    </svg>
                  </div>
                  {/* Camera icon and text */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ color: '#FFD700' }}
                    >
                      <Camera className="w-8 h-8" />
                    </div>
                    <span 
                      className="text-xs font-medium"
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
            className="flex-1 h-12 bg-black border-2 border-[#FFD700] text-white hover:bg-[#FFD700]/10 font-bold text-lg rounded-xl"
            disabled={isProcessing}
            style={{
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
            }}
          >
            RESET
          </Button>
          <Button 
            onClick={onCreate} 
            className="flex-1 h-12 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold text-lg rounded-xl"
            disabled={isProcessing}
            style={{
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
