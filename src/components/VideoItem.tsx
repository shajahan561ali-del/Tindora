import React, { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, Music, Gift } from "lucide-react";
import { User } from "firebase/auth";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import GiftingModal from "./GiftingModal";

interface VideoItemProps {
  video: {
    id: string;
    creatorId: string;
    creatorName: string;
    creatorPhoto: string;
    videoUrl: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
  };
  isActive: boolean;
  user: User | null;
  onAuthRequired: () => void;
}

export default function VideoItem({ video, isActive, user, onAuthRequired }: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isGiftingModalOpen, setIsGiftingModalOpen] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user && video.creatorId && user.uid !== video.creatorId) {
        const followRef = doc(db, "users", user.uid, "following", video.creatorId);
        const followSnap = await getDoc(followRef);
        setIsFollowing(followSnap.exists());
      }
    };
    if (isActive) checkFollowStatus();
  }, [isActive, user, video.creatorId]);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(async () => {
        if (user && video.id && !video.id.startsWith("mock")) {
           try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              coins: increment(5),
              updatedAt: serverTimestamp()
            });
            // Record transaction
            const rewardsRef = collection(db, "users", user.uid, "rewards");
            await addDoc(rewardsRef, {
              amount: 5,
              type: "view_reward",
              videoId: video.id,
              createdAt: serverTimestamp()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/rewards`);
          }
        }
      }, 5000); // 5 seconds of watching
      return () => clearTimeout(timer);
    }
  }, [isActive, user, video.id]);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleLike = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    
    setLiked(!liked);
    try {
      const videoRefDoc = doc(db, "videos", video.id);
      await updateDoc(videoRefDoc, {
        likesCount: liked ? increment(-1) : increment(1)
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `videos/${video.id}`);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (user.uid === video.creatorId) return;

    const newStatus = !isFollowing;
    setIsFollowing(newStatus);

    try {
      const myFollowingRef = doc(db, "users", user.uid, "following", video.creatorId);
      const theirFollowersRef = doc(db, "users", video.creatorId, "followers", user.uid);
      const myRef = doc(db, "users", user.uid);
      const theirRef = doc(db, "users", video.creatorId);

      if (newStatus) {
        await setDoc(myFollowingRef, { createdAt: serverTimestamp() });
        await setDoc(theirFollowersRef, { createdAt: serverTimestamp() });
        await updateDoc(myRef, { followingCount: increment(1) });
        await updateDoc(theirRef, { followersCount: increment(1) });
      } else {
        await deleteDoc(myFollowingRef);
        await deleteDoc(theirFollowersRef);
        await updateDoc(myRef, { followingCount: increment(-1) });
        await updateDoc(theirRef, { followersCount: increment(-1) });
      }
    } catch (error) {
      console.error("Follow error:", error);
      setIsFollowing(!newStatus); // Revert UI
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      if (!liked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  return (
    <div className="h-full w-full relative flex flex-col justify-center bg-black overflow-hidden" onClick={handleDoubleTap}>
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted={false}
      />

      {/* AI Caption Badge */}
      <div className="absolute top-24 left-6">
        <div className="bg-blue-600 text-[9px] font-black px-3 py-1 rounded italic flex items-center gap-2 tracking-tighter">
          <span className="animate-pulse">●</span> AI SMART CAPTION
        </div>
      </div>

      {/* Overlay Heart for Double Tap */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <Heart className="fill-[#00FF66] text-[#00FF66]" size={120} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end justify-between gap-4">
        <div className="flex-1 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#00FF66] p-0.5 overflow-hidden">
              <img src={video.creatorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.creatorId}`} className="w-full h-full object-cover rounded-full" alt="avatar" />
            </div>
            <div>
              <p className="font-black text-base tracking-tighter uppercase italic">@{video.creatorName}</p>
              {user?.uid !== video.creatorId && (
                <button 
                  onClick={handleFollow}
                  className={cn(
                    "text-[9px] mt-1 px-3 py-1 rounded-full font-black uppercase tracking-widest transition-colors",
                    isFollowing ? "bg-white/20 text-white" : "bg-[#00FF66] text-black"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed mb-5 drop-shadow-md max-w-[85%]">{video.caption}</p>
          <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-[#00FF66]">
            <Music size={14} className="animate-spin-slow" />
            <span className="truncate italic">Original Talent - {video.creatorName}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-8 mb-4">
          <button onClick={handleLike} className="flex flex-col items-center group">
            <div className={cn("w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90", liked ? "text-[#00FF66] scale-110" : "text-white")}>
              <Heart className={cn(liked && "fill-current")} size={26} />
            </div>
            <span className="text-white text-[10px] font-black mt-2 tracking-tighter italic">{video.likesCount}</span>
          </button>

          <button className="flex flex-col items-center group">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
              <MessageCircle size={26} />
            </div>
            <span className="text-white text-[10px] font-black mt-2 tracking-tighter italic">{video.commentsCount}</span>
          </button>

          <button 
            onClick={() => user ? setIsGiftingModalOpen(true) : onAuthRequired()}
            className="flex flex-col items-center group"
          >
            <div className="w-14 h-14 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center active:scale-90 transition-all text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.1)]">
              <Gift size={26} />
            </div>
            <span className="text-[#00FF66] text-[10px] font-black mt-2 tracking-tighter italic uppercase tracking-widest scale-75">Gift</span>
          </button>

          <button className="flex flex-col items-center group">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
              <Share2 size={26} />
            </div>
            <span className="text-white text-[10px] font-black mt-2 tracking-tighter italic uppercase tracking-widest scale-75">Send</span>
          </button>

          <div className="w-14 h-14 rounded-full border-4 border-[#00FF66]/20 overflow-hidden animate-spin-extra-slow-reverse flex items-center justify-center">
             <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <img src={video.creatorPhoto} className="w-full h-full object-cover" alt="disc" />
             </div>
          </div>
        </div>
      </div>
      
      <GiftingModal 
        isOpen={isGiftingModalOpen}
        onClose={() => setIsGiftingModalOpen(false)}
        creatorId={video.creatorId}
        creatorName={video.creatorName}
        videoId={video.id}
        user={user}
      />
    </div>
  );
}
