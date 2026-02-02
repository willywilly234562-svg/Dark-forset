import React, { useEffect } from 'react';
import { Sword } from 'lucide-react';

interface SwordAnimationProps {
  onComplete: () => void;
}

const SwordAnimation: React.FC<SwordAnimationProps> = ({ onComplete }) => {
  // Logic: Automatically trigger the completion callback after the animation duration.
  // The animation is set to ~1.2s in CSS, so we wait 1.2s before unmounting.
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm pointer-events-none">
      <style>{`
        @keyframes slide-in-left {
          0% { transform: translate(-150%, -150%) rotate(-45deg); opacity: 0; }
          40% { transform: translate(-10%, -10%) rotate(0deg); opacity: 1; }
          60% { transform: translate(0, 0) rotate(0deg); } /* Clash point */
          100% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
        }
        @keyframes slide-in-right {
          0% { transform: translate(150%, -150%) rotate(45deg) scaleX(-1); opacity: 0; }
          40% { transform: translate(10%, -10%) rotate(0deg) scaleX(-1); opacity: 1; }
          60% { transform: translate(0, 0) rotate(0deg) scaleX(-1); } /* Clash point */
          100% { transform: translate(0, 0) rotate(0deg) scaleX(-1); opacity: 0; }
        }
        @keyframes spark-flash {
          0%, 40% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes shake-screen {
          0%, 40% { transform: translate(0, 0); }
          45% { transform: translate(-5px, 5px); }
          50% { transform: translate(5px, -5px); }
          55% { transform: translate(-5px, -5px); }
          60% { transform: translate(0, 0); }
          100% { transform: translate(0, 0); }
        }
        .anim-sword-left { animation: slide-in-left 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-sword-right { animation: slide-in-right 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-spark { animation: spark-flash 1.2s ease-out forwards; }
        .anim-shake { animation: shake-screen 1.2s linear forwards; }
      `}</style>

      <div className="relative anim-shake">
        {/* Left Sword */}
        <div className="absolute inset-0 flex items-center justify-center anim-sword-left text-slate-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
           <Sword size={120} fill="currentColor" className="text-slate-300" />
        </div>

        {/* Right Sword (Mirrored via scaleX in CSS) */}
        <div className="absolute inset-0 flex items-center justify-center anim-sword-right text-slate-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
           <Sword size={120} fill="currentColor" className="text-slate-300" />
        </div>

        {/* Impact Spark */}
        <div className="absolute inset-0 flex items-center justify-center anim-spark">
            <div className="w-24 h-24 bg-yellow-100 rounded-full blur-xl opacity-80"></div>
            <div className="absolute w-32 h-2 bg-white rotate-45 rounded-full"></div>
            <div className="absolute w-32 h-2 bg-white -rotate-45 rounded-full"></div>
        </div>
        
        {/* Text Effect */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 animate-[fade-in_0.5s_0.4s_forwards]">
             <h2 className="text-4xl cinzel font-bold text-yellow-500 tracking-[0.5em] uppercase drop-shadow-lg">Battle Start</h2>
        </div>
      </div>
    </div>
  );
};

export default SwordAnimation;