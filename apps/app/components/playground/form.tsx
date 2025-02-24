"use client";

import React, { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Heart } from "lucide-react";

import Try from "./try";
import { motion, AnimatePresence } from "framer-motion";

export default function Form({
  setStreamInfo,
  pipeline,
}: {
  setStreamInfo: (streamInfo: any) => void;
  pipeline: any;
}) {
  return <Try pipeline={pipeline} setStreamInfo={setStreamInfo} />;
}

const HeartButton = () => {
  const [isLiked, setIsLiked] = useState(false);

  const particles = Array.from({ length: 12 }).map(() => ({
    x: Math.random() * 100 - 50,
    y: Math.random() * -80 - 20,
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    shape: Math.random() > 0.5 ? "circle" : "heart",
  }));

  return (
    <Button
      size="icon"
      variant="outline"
      className="max-w-10 max-h-10 relative"
      onClick={() => setIsLiked(!isLiked)}
    >
      <motion.div
        animate={
          isLiked
            ? {
                scale: [1, 1.5, 0.8, 1.2, 1],
                rotate: [0, -20, 20, -10, 0],
                y: [0, -5, 5, -3, 0],
              }
            : {
                scale: [1, 0.9, 1],
                rotate: 0,
                y: 0,
              }
        }
        transition={{
          duration: isLiked ? 0.7 : 0.3,
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
        className="relative z-10"
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 transform ${
            isLiked
              ? "fill-red-500 stroke-red-500 scale-110"
              : "fill-none stroke-current group-hover:stroke-red-400 group-hover:scale-105"
          }`}
        />
      </motion.div>

      <AnimatePresence>
        {isLiked &&
          particles.map((particle, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                scale: particle.scale,
                x: particle.x,
                y: particle.y,
                opacity: [1, 1, 0],
                rotate: particle.rotation,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.32, 0.72, 0, 1],
                opacity: { times: [0, 0.7, 1] },
              }}
              className="absolute left-1/2 top-1/2 -ml-1 -mt-1"
            >
              {particle.shape === "circle" ? (
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500" />
              ) : (
                <Heart className="w-2 h-2 fill-red-500 stroke-red-500" />
              )}
            </motion.div>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {isLiked && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{
                scale: [1, 2.5],
                opacity: [0.5, 0],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full border-2 border-red-500"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{
                scale: [1, 2.2],
                opacity: [0.5, 0],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="absolute inset-0 rounded-full border-2 border-pink-500"
            />
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={
          isLiked
            ? {
                scale: [1, 2, 0],
                opacity: [0.4, 0.2, 0],
              }
            : { scale: 0, opacity: 0 }
        }
        transition={{ duration: 0.6 }}
        className="absolute inset-0 bg-gradient-to-r from-red-100 to-pink-100 rounded-full z-0"
      />

      <motion.div
        initial={false}
        animate={isLiked ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100  transition-opacity"
      />
    </Button>
  );
};
