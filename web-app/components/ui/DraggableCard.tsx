"use client";

import React, { useState } from "react";
import { GripVertical } from "lucide-react";
import DashboardCard from "./DashboardCard";

type DraggableCardProps = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  isDragging: boolean;
  collapsible?: boolean;
  variant?: "default" | "gradient" | "highlighted";
};

const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  title,
  icon,
  children,
  onDragStart,
  onDragOver,
  isDragging,
  collapsible = false,
  variant = "default",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", id);
    onDragStart(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(id);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mb-4 transition-all duration-200 ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isDragOver ? "transform translate-y-1" : ""}`}
    >
      <DashboardCard
        title={title}
        icon={icon}
        collapsible={collapsible}
        variant={variant}
        headerExtra={
          <div className="cursor-move mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <GripVertical size={16} />
          </div>
        }
      >
        {children}
      </DashboardCard>
    </div>
  );
};

export default DraggableCard; 