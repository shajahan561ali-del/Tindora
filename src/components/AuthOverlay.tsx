import React, { useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  AuthError
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { X, Mail, Lock, User, Phone } from "lucide-react";
import { motion } from "motion/react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "../lib/utils";

interface AuthOverlayProps {
  onClose: () => void;
}

type AuthMode = "login" | "signup";

export default function AuthOverlay({ onClose }: AuthOverlayProps) {
  const [error, setError] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [authType, setAuthType] = useState<"email" | "phone">("email");

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize user data if first time
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        username: result.user.displayName || "Gamer",
        email: result.user.email,
        coins: 100,
        followersCount: 0,
        followingCount: 0,
        totalEarnings: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });

      onClose();
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code === "auth/popup-closed-by-user") {
        return;
      }
      console.error(authError);
      setError("Failed to sign in. Please try again.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authType === "phone") {
        setError("Phone authentication requires SMS verification. Please use Email for this demo.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, identifier, password);
        await updateProfile(result.user, { displayName: username });
        
        // Initialize user data
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          username: username || identifier.split("@")[0],
          email: identifier,
          coins: 100,
          followersCount: 0,
          followingCount: 0,
          totalEarnings: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, identifier, password);
      }
      onClose();
    } catch (err) {
      const authError = err as AuthError;
      console.error(authError);
      if (authError.code === "auth/email-already-in-use") {
        setError("Email already in use.");
      } else if (authError.code === "auth/operation-not-allowed") {
        setError("Login method not enabled. Please enable 'Email/Password' in your Firebase Console under Authentication > Sign-in method.");
      } else if (authError.code === "auth/invalid-credential" || authError.code === "auth/user-not-found" || authError.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (authError.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(authError.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-8 relative overflow-y-auto max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase italic">
            {mode === "login" ? "Welcome Back" : "Join Talent"}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1px] w-4 bg-white/20" />
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
              {mode === "login" ? "Creator Login" : "Creator Signup"}
            </p>
            <span className="h-[1px] w-4 bg-white/20" />
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setAuthType("email")}
            className={cn(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              authType === "email" ? "bg-white/10 text-white shadow-sm" : "text-white/30"
            )}
          >
            Email
          </button>
          <button 
            onClick={() => setAuthType("phone")}
            className={cn(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
              authType === "phone" ? "bg-white/10 text-white shadow-sm" : "text-white/30"
            )}
          >
            Mobile
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-4 rounded-xl mb-6 font-bold uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="text"
                placeholder="USERNAME"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-black uppercase tracking-wider focus:border-[#00FF66]/50 focus:outline-none transition-colors"
              />
            </div>
          )}
          <div className="relative">
            {authType === "email" ? (
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            ) : (
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            )}
            <input
              type={authType === "email" ? "email" : "tel"}
              placeholder={authType === "email" ? "EMAIL ADDRESS" : "MOBILE NUMBER"}
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-black uppercase tracking-wider focus:border-[#00FF66]/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="password"
              placeholder="PASSWORD"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-black uppercase tracking-wider focus:border-[#00FF66]/50 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00FF66] text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#00FF66]/10 tracking-[0.3em] text-sm uppercase italic disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "login" ? "Enter Studio" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-white/5" />
          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">OR</span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-4 bg-white/5 border border-white/10 text-white font-black py-4 rounded-xl hover:bg-white/10 active:scale-95 transition-all tracking-widest text-xs uppercase"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale" />
          Fast Track with Google
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-[10px] font-black text-white/40 hover:text-[#00FF66] uppercase tracking-[0.2em] transition-colors"
          >
            {mode === "login" ? "New Creator? Register" : "Have Account? Login"}
          </button>
        </div>

        <p className="mt-8 text-center text-[9px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">
          By continuing, you agree to our <br />
          <span className="text-white/40">Terms and Conditions</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
