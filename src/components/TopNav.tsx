import { Search, Bell } from "lucide-react";
import { ViewState } from "../App";

interface TopNavProps {
  currentView: ViewState;
  onToggleSearch: () => void;
}

export default function TopNav({ currentView, onToggleSearch }: TopNavProps) {
  if (currentView !== "feed") return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-3">
        <div className="skew-label text-xl tracking-tighter">TRENDora</div>
        <div className="hidden sm:block text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 border-l border-white/20 pl-3">
          Local Talent
        </div>
      </div>
      <div className="flex items-center gap-4 text-white">
        <button id="top-search" onClick={onToggleSearch} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <Search size={20} />
        </button>
        <button id="top-notifications" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <Bell size={20} />
        </button>
      </div>
    </div>
  );
}
