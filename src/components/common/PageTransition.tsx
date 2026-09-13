import React, { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Premium, fluid page transition component using motion/react.
 * Provides a gentle upward slide with smooth opacity blend and spring-damped ease.
 */
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(3px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
