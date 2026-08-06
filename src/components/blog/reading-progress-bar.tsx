"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="bg-primary fixed top-0 right-0 left-0 z-50 h-0.5 origin-left"
      aria-hidden
    />
  );
}
