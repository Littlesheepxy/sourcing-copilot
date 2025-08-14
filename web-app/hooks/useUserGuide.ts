'use client';

import { useState, useEffect, useCallback } from 'react';
import { driver, DriveStep, Config } from 'driver.js';

interface UseUserGuideOptions {
  storageKey?: string;
  autoStart?: boolean;
  config?: Partial<Config>;
}

export function useUserGuide(
  steps: DriveStep[],
  options: UseUserGuideOptions = {}
) {
  const {
    storageKey = 'hasCompletedGuide',
    autoStart = false,
    config = {}
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [driverInstance, setDriverInstance] = useState<ReturnType<typeof driver> | null>(null);

  // 检查用户是否已完成引导
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey) === 'true';
      setHasCompleted(completed);
    }
  }, [storageKey]);

  // 创建 driver 实例
  useEffect(() => {
    if (steps.length === 0) return;

    const defaultConfig: any = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      allowClose: true,
      smoothScroll: true,
      animate: true,
      progressText: '第 {{current}} 步，共 {{total}} 步',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      onDestroyed: () => {
        setIsActive(false);
        markAsCompleted();
      },
      onDestroyStarted: () => {
        setIsActive(false);
      },
      ...config
    };

    const instance = driver({
      ...defaultConfig,
      steps
    });

    setDriverInstance(instance);

    return () => {
      if (instance) {
        instance.destroy();
      }
    };
  }, [steps, config]);

  // 自动开始引导
  useEffect(() => {
    if (autoStart && !hasCompleted && driverInstance && !isActive) {
      startGuide();
    }
  }, [autoStart, hasCompleted, driverInstance, isActive]);

  // 开始引导
  const startGuide = useCallback(() => {
    if (driverInstance && !isActive) {
      setIsActive(true);
      driverInstance.drive();
    }
  }, [driverInstance, isActive]);

  // 停止引导
  const stopGuide = useCallback(() => {
    if (driverInstance && isActive) {
      driverInstance.destroy();
      setIsActive(false);
    }
  }, [driverInstance, isActive]);

  // 下一步
  const nextStep = useCallback(() => {
    if (driverInstance && isActive) {
      driverInstance.moveNext();
    }
  }, [driverInstance, isActive]);

  // 上一步
  const prevStep = useCallback(() => {
    if (driverInstance && isActive) {
      driverInstance.movePrevious();
    }
  }, [driverInstance, isActive]);

  // 标记为已完成
  const markAsCompleted = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      setHasCompleted(true);
    }
  }, [storageKey]);

  // 重置完成状态
  const resetCompletion = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      setHasCompleted(false);
    }
  }, [storageKey]);

  return {
    isActive,
    hasCompleted,
    startGuide,
    stopGuide,
    nextStep,
    prevStep,
    markAsCompleted,
    resetCompletion,
    driverInstance
  };
} 