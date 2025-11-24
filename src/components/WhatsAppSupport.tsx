import whatsappIcon from "@/assets/whatsapp-icon.png";

const SUPPORT_NUMBER = "917734990035";
const WHATSAPP_URL = `https://wa.me/${SUPPORT_NUMBER}`;

export default function WhatsAppSupport() {
  const handleWhatsAppClick = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-24 right-6 z-50 w-14 h-14 transition-all duration-300 hover:scale-110"
      aria-label="Contact support on WhatsApp"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
    </button>
  );
}
