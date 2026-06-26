import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20 // Slide in from right
  },
  in: {
    opacity: 1,
    x: 0
  },
  out: {
    opacity: 0,
    x: -20 // Slide out to left
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1], // Native-like curve
  duration: 0.35
} as any;

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className, style }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`w-[100%] h-[100%] flex flex-col ${className}`}
      style={{ ...style }}>
      
      {children}
    </motion.div>);

};

export default AnimatedPage;