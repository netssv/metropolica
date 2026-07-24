'use client';
import { useState, useEffect } from 'react';
import { devManager, DevLogEntry, SelectedObjectInfo } from '../lib/devModeManager';

export function useDevMode() {
  const [isActive, setIsActive] = useState(devManager.isActive());
  const [isPaused, setIsPaused] = useState(devManager.isPaused());
  const [selectedObject, setSelectedObject] = useState<SelectedObjectInfo | null>(devManager.getSelectedObject());
  const [logs, setLogs] = useState<DevLogEntry[]>(devManager.getLogs());

  useEffect(() => {
    const unsubscribeState = devManager.subscribeState(() => {
      setIsActive(devManager.isActive());
      setIsPaused(devManager.isPaused());
      setSelectedObject(devManager.getSelectedObject());
    });

    const unsubscribeLogs = devManager.subscribeLogs((newLogs) => {
      setLogs(newLogs);
    });

    return () => {
      unsubscribeState();
      unsubscribeLogs();
    };
  }, []);

  return {
    isActive,
    isPaused,
    selectedObject,
    logs,
    toggleDevMode: () => devManager.toggleActive(),
    setDevMode: (val: boolean) => devManager.setActive(val),
    togglePaused: () => devManager.togglePaused(),
    clearLogs: () => devManager.clearLogs(),
    addLog: (level: any, category: string, msg: string, details?: any) => devManager.addLog(level, category, msg, details),
    setSelectedObject: (obj: SelectedObjectInfo | null) => devManager.setSelectedObject(obj)
  };
}
