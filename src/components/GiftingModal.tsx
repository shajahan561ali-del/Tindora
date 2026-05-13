import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coins, X, Zap, Star, Trophy, Rocket, Heart } from "lucide-react";
import { doc, increment, serverTimestamp, runTransaction, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";
import { cn } from "../lib/utils";

interface Gift {
  id: string;
  name: string;
  icon: React.ReactNode;
  cost: number;
  color: string;
}

const GIFTS: Gift[] = [
  { id: "star", name: "Star", icon: <Star size={24} />, cost: 10, color: "text-yellow-400" },
  { id: "zap", name: "Zap", icon: <Zap size={24} />, cost: 50, color: "text-blue-400" },
  { id: "heart", name: "Heart", icon: <Heart size={24} />, cost: 100, color: "text-red-400" },
  { id: "trophy", name: "Trophy", icon: <Trophy size={24} />, cost: 500, color: "text-orange-400" },
  { id: "rocket", name: "Rocket", icon: <Rocket size={24} />, cost: 1000, color: "text-purple-400" },
];

interface GiftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  videoId: string;
  user: User | null;
}

export default function GiftingModal({ isOpen, onClose, creatorId, creatorName, videoId, user }: GiftingModalProps) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendGift = async () => {
    if (!user || !selectedGift || sending) return;
    if (user.uid === creatorId) {
      setError("Cannot gift yourself!");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const creatorRef = doc(db, "users", creatorId);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User record not found");
        
        const currentCoins = userSnap.data().coins || 0;
        if (currentCoins < selectedGift.cost) {
          throw new Error("Insufficient coins!");
        }

        // Deduct from sender
        transaction.update(userRef, {
          coins: increment(-selectedGift.cost),
          updatedAt: serverTimestamp()
        });

        // Add to receiver
        transaction.update(creatorRef, {
          coins: increment(selectedGift.cost),
          totalEarnings: increment(selectedGift.cost),
          updatedAt: serverTimestamp()
        });

        // Record for sender
        const senderRewardRef = doc(collection(db, "users", user.uid, "rewards"));
        transaction.set(senderRewardRef, {
          amount: -selectedGift.cost,
          type: "gift_sent",
          giftName: selectedGift.name,
          videoId: videoId,
          recipientId: creatorId,
          recipientName: creatorName,
          createdAt: serverTimestamp()
        });

        // Record for receiver
        const receiverRewardRef = doc(collection(db, "users", creatorId, "rewards"));
        transaction.set(receiverRewardRef, {
          amount: selectedGift.cost,
          type: "gift_received",
          giftName: selectedGift.name,
          videoId: videoId,
          senderId: user.uid,
          senderName: user.displayName || "Someone",
          createdAt: serverTimestamp()
        });
      });

      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to send gift");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="relative w-full max-w-lg bg-[#111] rounded-t-[32px] p-8 pb-12 border-t border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Support talent</h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Send a gift to @{creatorName}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-10">
              {GIFTS.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-2xl border-2 transition-all relative group",
                    selectedGift?.id === gift.id 
                      ? "bg-white/5 border-[#00FF66] scale-105" 
                      : "bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  <div className={cn("p-3 rounded-xl bg-black/40 mb-3", gift.color)}>
                    {gift.icon}
                  </div>
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{gift.name}</span>
                  <div className="flex items-center gap-1 mt-1 text-[#00FF66]">
                    <Coins size={10} />
                    <span className="text-xs font-bold">{gift.cost}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              disabled={!selectedGift || sending}
              onClick={handleSendGift}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] italic text-sm transition-all flex items-center justify-center gap-3",
                selectedGift 
                  ? "bg-[#00FF66] text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[1.02] active:scale-95" 
                  : "bg-white/10 text-white/20 cursor-not-allowed"
              )}
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>SEND {selectedGift?.name.toUpperCase() || "GIFT"}</>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
