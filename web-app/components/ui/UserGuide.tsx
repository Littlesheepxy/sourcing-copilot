'use client';

import { useEffect, useRef } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

interface UserGuideProps {
  steps: DriveStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  config?: Partial<Config>;
  autoStart?: boolean;
}

export default function UserGuide({ 
  steps, 
  onComplete, 
  onSkip, 
  config = {},
  autoStart = false 
}: UserGuideProps) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    // 默认配置
    const defaultConfig: any = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      allowClose: true,
      smoothScroll: true,
      animate: true,
      popoverClass: 'driverjs-theme',
      progressText: '第 {{current}} 步，共 {{total}} 步',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      onDestroyed: () => {
        if (onComplete) onComplete();
      },
      onDestroyStarted: () => {
        if (onSkip) onSkip();
      },
      ...config
    };

    // 创建driver实例
    driverRef.current = driver({
      ...defaultConfig,
      steps
    });

    // 如果设置了自动开始，则启动引导
    if (autoStart) {
      driverRef.current.drive();
    }

    // 清理函数
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [steps, onComplete, onSkip, config, autoStart]);

  // 提供手动控制方法
  const startGuide = () => {
    if (driverRef.current) {
      driverRef.current.drive();
    }
  };

  const stopGuide = () => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  };

  const nextStep = () => {
    if (driverRef.current) {
      driverRef.current.moveNext();
    }
  };

  const prevStep = () => {
    if (driverRef.current) {
      driverRef.current.movePrevious();
    }
  };

  // 暴露控制方法给父组件
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).userGuide = {
        start: startGuide,
        stop: stopGuide,
        next: nextStep,
        prev: prevStep
      };
    }
  }, []);

  return null; // 这个组件不渲染任何内容，只是管理driver.js
} 