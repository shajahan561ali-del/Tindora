import React, { useEffect, useState, useRef } from "react";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import VideoItem from "./VideoItem";
import { User } from "firebase/auth";

interface VideoData {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
  videoUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  userId?: string;
}

interface VideoFeedProps {
  user: User | null;
  onAuthRequired: () => void;
}

const MOCK_VIDEOS: VideoData[] = [
  {
    id: "mock1",
    creatorId: "system",
    creatorName: "Trendora Official",
    creatorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Trendora",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40030-preview.mp4",
    caption: "Welcome to Trendora! Upload your first video to start earning. 🚀 #local #talent",
    likesCount: 1200,
    commentsCount: 45,
  },
  {
    id: "mock2",
    creatorId: "system",
    creatorName: "Local Hero",
    creatorPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hero",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-a-street-light-at-night-40033-preview.mp4",
    caption: "Showing off some local moves. #dance #assam",
    likesCount: 850,
    commentsCount: 22,
  }
];

export default function VideoFeed({ user, onAuthRequired }: VideoFeedProps) {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "videos"),
      limit(20)
    );

    console.log("VideoFeed: Querying videos...");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`VideoFeed: snapshot received. doc count: ${snapshot.docs.length}`);
      const videoList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VideoData[];
      
      if (videoList.length === 0) {
        setVideos(MOCK_VIDEOS);
      } else {
        setVideos(videoList);
      }
    }, (error) => {
      console.error("VideoFeed: onSnapshot error:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, "videos");
      } catch (err) {
        console.error("VideoFeed Firestore Error Detail:", err);
      }
      setVideos(MOCK_VIDEOS);
    });

    return () => unsubscribe();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPos = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    const index = Math.round(scrollPos / height);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-[#050505]"
    >
      {videos.map((video, index) => (
        <div key={video.id} className="h-full w-full snap-start snap-always relative">
          <VideoItem
            video={video}
            isActive={index === currentIndex}
            user={user}
            onAuthRequired={onAuthRequired}
          />
        </div>
      ))}
    </div>
  );
}
