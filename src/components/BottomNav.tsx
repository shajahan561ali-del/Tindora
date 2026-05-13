import { Home, User, PlusCircle, Award } from "lucide-react";
import { ViewState } from "../App";
import { User as FirebaseUser } from "firebase/auth";
import { cn } from "../lib/utils";

interface BottomNavProps {
  currentView: ViewState;
  onSetView: (view: ViewState) => void;
  user: FirebaseUser | null;
  onAuthRequired: () => void;
}

export default function BottomNav({ currentView, onSetView, user, onAuthRequired }: BottomNavProps) {
  const tabs = [
    { id: "feed", icon: Home, label: "HOME" },
    { id: "upload", icon: PlusCircle, label: "POST" },
    { id: "rewards", icon: Award, label: "EARN" },
    { id: "profile", icon: User, label: "YOU" },
  ];

  return (
    <nav className="h-20 flex items-center justify-around bg-[#050505] border-t border-white/5 px-4 pb-safe">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`nav-${tab.id}`}
          onClick={() => {
            if (tab.id !== "feed" && !user) {
              onAuthRequired();
            } else {
              onSetView(tab.id as ViewState);
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center w-full transition-all group",
            currentView === tab.id ? "text-[#00FF66]" : "text-white/40 hover:text-white/70"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-all",
            currentView === tab.id && "bg-[#00FF66]/10"
          )}>
            <tab.icon size={26} strokeWidth={currentView === tab.id ? 2.5 : 2} />
          </div>
          <span className="text-[9px] mt-1 font-black tracking-widest">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
