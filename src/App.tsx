/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import VideoFeed from "./components/VideoFeed";
import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import Profile from "./components/Profile";
import UploadVideo from "./components/UploadVideo";
import RewardCenter from "./components/RewardCenter";
import AuthOverlay from "./components/AuthOverlay";
import { AnimatePresence, motion } from "motion/react";

export type ViewState = "feed" | "profile" | "upload" | "rewards";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>("feed");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Create user doc if not exists
          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              username: firebaseUser.email?.split("@")[0] || "user_" + firebaseUser.uid.slice(0, 5),
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              coins: 0,
              followersCount: 0,
              followingCount: 0,
              createdAt: serverTimestamp(),
            });
          }
          setUser(firebaseUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-bold tracking-tighter"
        >
          TRENDORA
        </motion.div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "feed":
        return <VideoFeed user={user} onAuthRequired={() => setShowAuth(true)} />;
      case "profile":
        return user ? (
          <Profile user={user} onLogout={() => auth.signOut()} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white p-8">
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Login to view profile</h2>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-[#00FF66] text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all"
            >
              Sign In
            </button>
          </div>
        );
      case "upload":
        return user ? (
          <UploadVideo user={user} onComplete={() => setCurrentView("feed")} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white p-8">
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Login to upload</h2>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-[#00FF66] text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all"
            >
              Sign In
            </button>
          </div>
        );
      case "rewards":
        return user ? (
          <RewardCenter user={user} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white p-8">
            <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Login to earn rewards</h2>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-[#00FF66] text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all"
            >
              Sign In
            </button>
          </div>
        );
      default:
        return <VideoFeed user={user} onAuthRequired={() => setShowAuth(true)} />;
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden flex flex-col font-sans">
      <TopNav currentView={currentView} onToggleSearch={() => {}} />
      
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="h-10 bg-[#00FF66] text-black flex items-center overflow-hidden whitespace-nowrap z-50">
        <div className="flex animate-marquee font-black uppercase text-[10px] italic py-2">
          <span className="mx-8 tracking-widest">JAYANTA JUST EARNED ₹500 FROM REFERRALS</span>
          <span className="mx-8 tracking-widest">TRENDING: #LOCAL_TALENT CHALLENGE (₹10,000 PRIZE)</span>
          <span className="mx-8 tracking-widest">RAHUL SOLD 24 PRODUCTS VIA MARKETPLACE</span>
          <span className="mx-8 tracking-widest">TRENDORA: INDIA'S FIRST EARNING SOCIAL APP</span>
          <span className="mx-8 tracking-widest">JAYANTA JUST EARNED ₹500 FROM REFERRALS</span>
          <span className="mx-8 tracking-widest">TRENDING: #LOCAL_TALENT CHALLENGE (₹10,000 PRIZE)</span>
        </div>
      </footer>

      <BottomNav
        currentView={currentView}
        onSetView={setCurrentView}
        user={user}
        onAuthRequired={() => setShowAuth(true)}
      />

      <AnimatePresence>
        {showAuth && (
          <AuthOverlay onClose={() => setShowAuth(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
