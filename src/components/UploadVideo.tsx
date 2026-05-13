import React, { useState } from "react";
import { User } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Sparkles, Loader2, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UploadVideoProps {
  user: User;
  onComplete: () => void;
}

export default function UploadVideo({ user, onComplete }: UploadVideoProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleAiCaption = async () => {
    if (!videoUrl) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: caption || "a trending video" }),
      });
      const data = await res.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;
    setLoading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      await addDoc(collection(db, "videos"), {
        creatorId: user.uid,
        creatorName: user.displayName || user.email?.split("@")[0],
        creatorPhoto: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        videoUrl,
        caption,
        likesCount: 0,
        viewsCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });
      setProgress(100);
      setTimeout(() => onComplete(), 500);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "videos");
      setLoading(false);
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="h-full w-full bg-[#050505] text-white p-6 overflow-y-auto pb-32 relative">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-10"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-20 h-20 border-4 border-[#00FF66]/20 border-t-[#00FF66] rounded-full mb-8"
            />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Publishing Talent</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Optimizing for local feed...</p>
            
            <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#00FF66]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-3 mb-10">
        <div className="skew-label text-sm uppercase">CREATE</div>
        <h2 className="text-2xl font-black tracking-tighter italic uppercase">Post Talent</h2>
      </div>

      <form onSubmit={handleUpload} className="space-y-8">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Video Link (MP4)</label>
          <div className="relative">
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="PASTE MP4 LINK..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pl-14 font-black tracking-widest text-sm focus:outline-none focus:border-[#00FF66] transition-all placeholder:text-white/10 cursor-pointer italic"
            />
            <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00FF66]" size={20} />
          </div>
        </div>

        <div>
           <div className="flex items-center justify-between mb-3">
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Caption</label>
            <button 
              type="button"
              onClick={handleAiCaption}
              disabled={generating}
              className="flex items-center gap-2 text-[10px] font-black text-[#00FF66] uppercase tracking-[0.2em] hover:text-white transition-colors disabled:opacity-30"
            >
              <Sparkles size={14} />
              {generating ? "AI WORKING..." : "AI MAGIC"}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="WRITE SOMETHING VIRAL..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-[#00FF66] transition-all resize-none font-medium text-sm placeholder:text-white/10"
          />
        </div>

        {videoUrl && (
          <div className="aspect-[9/16] w-full max-w-[240px] mx-auto rounded-3xl overflow-hidden border-4 border-white/10 bg-black relative shadow-2xl">
             <video src={videoUrl} className="w-full h-full object-cover" controls />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00FF66] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#00FF66]/10 active:scale-95 transition-all uppercase tracking-widest text-lg"
        >
          {loading ? <Loader2 className="animate-spin text-black" /> : "POST NOW"}
        </button>
      </form>
    </div>
  );
}
