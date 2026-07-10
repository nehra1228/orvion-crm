"use client";

import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* Blue */}
      <motion.div
        animate={{
          x: [-120, 80, -120],
          y: [-80, 60, -80],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-48 -left-48 h-[650px] w-[650px] rounded-full bg-blue-600/20 blur-[170px]"
      />

      {/* Cyan */}
      <motion.div
        animate={{
          x: [100, -60, 100],
          y: [50, -70, 50],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-[-180px] h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-[180px]"
      />

      {/* Gold */}
      <motion.div
        animate={{
          x: [0, -90, 0],
          y: [80, -60, 80],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-220px] left-1/3 h-[700px] w-[700px] rounded-full bg-yellow-400/10 blur-[220px]"
      />

      {/* Ambient radial light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.03),transparent_70%)]" />

    </div>
  );
}