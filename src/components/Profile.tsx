import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Settings, LogOut, Grid, Bookmark, Award } from "lucide-react";
import { DocumentData } from "firebase/firestore";

interface ProfileProps {
  user: FirebaseUser;
  onLogout: () => void;
}

interface UserData extends DocumentData {
  username?: string;
  displayName?: string;
  followersCount?: number;
  followingCount?: number;
  coins?: number;
}

interface VideoProfileData extends DocumentData {
  id: string;
  videoUrl: string;
  likesCount: number;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userVideos, setUserVideos] = useState<VideoProfileData[]>([]);

  useEffect(() => {
    const userRef = doc(db, "users", user.uid);
    const unsubProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    const fetchVideos = async () => {
      try {
        const q = query(collection(db, "videos"), where("creatorId", "==", user.uid));
        const videoSnap = await getDocs(q);
        setUserVideos(videoSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, "videos/user-filter");
        } catch (e) {
          console.error("Profile view error detail:", e);
        }
      }
    };
    fetchVideos();

    return () => unsubProfile();
  }, [user]);

  return (
    <div className="h-full w-full bg-[#050505] text-white p-6 overflow-y-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold">Profile</h2>
        <div className="flex gap-4">
          <Settings size={20} className="text-white/60" />
          <button onClick={onLogout}>
            <LogOut size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-[#00FF66]/30 overflow-hidden p-1">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-full h-full object-cover rounded-full" alt="profile" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#00FF66] rounded-full p-1.5 border-2 border-black">
            <Award size={14} className="text-black fill-black" />
          </div>
        </div>
        <h3 className="text-3xl font-black tracking-tighter italic uppercase">@{userData?.username || "user"}</h3>
        <p className="text-[#00FF66] text-[10px] font-black uppercase tracking-[0.2em] mb-6">{userData?.displayName || "Creator"}</p>

        <div className="flex gap-8 text-center bg-white/5 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/5">
          <div>
            <p className="font-black text-xl mono-value">{userData?.followersCount || 0}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Followers</p>
          </div>
          <div className="w-px h-full bg-white/10" />
          <div>
            <p className="font-black text-xl mono-value">{userData?.followingCount || 0}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Following</p>
          </div>
          <div className="w-px h-full bg-white/10" />
          <div>
            <p className="font-black text-xl mono-value text-[#00FF66]">₹{userData?.coins || 0}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Earned</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button className="flex-1 pb-3 border-b-2 border-white flex justify-center"><Grid size={20} /></button>
        <button className="flex-1 pb-3 border-b-2 border-transparent text-white/40 flex justify-center"><Bookmark size={20} /></button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {userVideos.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-white/20">
            <Grid size={48} className="mb-2" />
            <p className="text-sm">No videos yet</p>
          </div>
        ) : (
          userVideos.map(vid => (
            <div key={vid.id} className="aspect-[9/16] bg-neutral-900 overflow-hidden relative group">
              <video src={vid.videoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-1 left-1 text-[10px] bg-black/50 px-1 rounded flex items-center gap-0.5">
                <span>{vid.likesCount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
