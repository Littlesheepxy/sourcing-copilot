"use client";

import React from "react";
import AppLayout from "../components/layout/AppLayout";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, FilePlus, Settings, Bot } from "lucide-react";

// 卡片容器动画
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// 卡片项动画
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return <AppLayout />;
} 