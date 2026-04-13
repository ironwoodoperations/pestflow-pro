import { useState, useRef } from "react";
import { Play } from "lucide-react";

const MidPageVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const VIDEO_URL = "https://www.dangpestcontrol.com/wp-content/uploads/2025/04/dang-pest-referral-video.mp4";

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = VIDEO_URL;
        videoRef.current.play();
      }
    }, 100);
  };

  return (
    <section
      className="py-12"
      style={{
        background: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ border: "5px solid hsl(20, 40%, 12%)" }}
        >
          {!isPlaying ? (
            <div
              className="relative w-full cursor-pointer group"
              onClick={handlePlay}
            >
              <div className="relative w-full aspect-video">
                <img
                  src="https://www.dangpestcontrol.com/wp-content/uploads/2025/05/dang-pest-homepage-img.png"
                  alt="Get Free Pest Control For Life"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}>
                    <Play className="w-10 h-10 ml-1" style={{ color: 'hsl(20, 40%, 12%)' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover"
              controls
              playsInline
              autoPlay
              preload="none"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default MidPageVideo;
