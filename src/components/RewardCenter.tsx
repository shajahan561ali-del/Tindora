import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, collection, query, limit, onSnapshot, updateDoc, increment, serverTimestamp, addDoc, Timestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { ArrowUpRight, Play, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { DocumentData } from "firebase/firestore";

interface RewardCenterProps {
  user: FirebaseUser;
}

interface UserData extends DocumentData {
  coins?: number;
}

interface RewardData extends DocumentData {
  id: string;
  amount: number;
  type: string;
  senderName?: string;
  recipientName?: string;
  giftName?: string;
  createdAt?: Timestamp;
}

export default function RewardCenter({ user }: RewardCenterProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [rewards, setRewards] = useState<RewardData[]>([]);

  useEffect(() => {
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setUserData(snap.data());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const q = query(
      collection(db, "users", user.uid, "rewards"),
      limit(10)
    );
    const unsubRewards = onSnapshot(q, (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/rewards`);
    });

    return () => {
      unsubUser();
      unsubRewards();
    };
  }, [user]);

  return (
    <div className="h-full w-full bg-[#050505] text-white p-6 overflow-y-auto pb-32">
      <div className="flex items-center gap-3 mb-10">
        <div className="skew-label text-sm uppercase">WALLET</div>
        <h2 className="text-2xl font-black tracking-tighter italic">REWARDS</h2>
      </div>

      <div className="bg-[#0a0a0a] rounded-[2rem] p-10 mb-10 border border-white/5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00FF66]/10 blur-[80px]" />
        
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black">Available Balance</p>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-black italic tracking-tighter text-[#00FF66]">₹{userData?.coins || 0}</span>
          </div>
          <p className="text-xs font-mono text-white/30 uppercase mt-2 italic tracking-widest">
            ↑ 22% earned today
          </p>
        </div>

        <button className="w-full bg-[#00FF66] hover:scale-105 active:scale-95 text-black font-black py-5 rounded-2xl transition-all shadow-[0_0_40px_rgba(0,255,102,0.15)] uppercase tracking-widest text-lg">
          Withdraw To Bank
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
          <Play className="text-[#00FF66] mb-3" size={24} />
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Views</p>
          <p className="text-2xl font-black mono-value">3.4K</p>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 group relative overflow-hidden cursor-pointer" 
             onClick={async () => {
               try {
                 const userRef = doc(db, "users", user.uid);
                 await updateDoc(userRef, {
                   coins: increment(50),
                   updatedAt: serverTimestamp()
                 });
                 const rewardsRef = collection(db, "users", user.uid, "rewards");
                 await addDoc(rewardsRef, {
                   amount: 50,
                   type: "ad_revenue",
                   createdAt: serverTimestamp()
                 });
                 alert("You earned 50 coins from an ad!");
               } catch (e) {
                 console.error(e);
               }
             }}>
          <div className="absolute inset-0 bg-[#00FF66]/5 group-hover:bg-[#00FF66]/10 transition-colors" />
          <Zap className="text-blue-400 mb-3" size={24} />
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Watch Ad</p>
          <p className="text-sm font-black text-[#00FF66] uppercase tracking-tighter italic">+50 Coins</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 px-2 italic">Recent Log</h3>
        {rewards.length === 0 ? (
          <div className="bg-white/2 rounded-2xl p-10 text-center border border-dashed border-white/10">
            <p className="text-sm text-white/20 font-black uppercase tracking-widest italic">Start creating to earn</p>
          </div>
        ) : (
          rewards.map(reward => (
            <div key={reward.id} className="bg-white/5 flex items-center justify-between p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  reward.amount > 0 ? "bg-[#00FF66]/10" : "bg-red-500/10"
                )}>
                  {reward.amount > 0 ? (
                    <ArrowUpRight className="text-[#00FF66]" size={20} />
                  ) : (
                    <ArrowUpRight className="text-red-500 rotate-90" size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">
                    {reward.type === 'gift_received' ? `Gift from ${reward.senderName}` : 
                     reward.type === 'gift_sent' ? `Gift to ${reward.recipientName}` : 
                     reward.type.replace('_', ' ')}
                  </p>
                  <p className="text-[10px] font-mono text-white/30 truncate max-w-[150px]">
                    {reward.giftName ? `${reward.giftName} • ` : ''}
                    {reward.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                  </p>
                </div>
              </div>
              <p className={cn(
                "text-xl font-black mono-value",
                reward.amount > 0 ? "text-[#00FF66]" : "text-red-500"
              )}>
                {reward.amount > 0 ? '+' : ''}{reward.amount}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
