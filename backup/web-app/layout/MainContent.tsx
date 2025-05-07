"use client";

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <motion.main 
      className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {children}
      </div>
    </motion.main>
  );
} 