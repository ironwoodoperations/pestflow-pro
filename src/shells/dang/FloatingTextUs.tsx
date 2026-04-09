import { MessageCircle } from "lucide-react";
import { useIsMobile } from "./hooks/use-mobile";
import { useLocation } from "react-router-dom";

const FloatingTextUs = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Hide on admin pages
  if (!isMobile || location.pathname.startsWith("/admin")) return null;

  return (
    <a
      href="sms:9038710550"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg hover:opacity-90 transition-opacity animate-in fade-in slide-in-from-bottom-4 duration-500"
      aria-label="Text us at (903) 871-0550"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="font-body font-bold text-sm">Text Us</span>
    </a>
  );
};

export default FloatingTextUs;
