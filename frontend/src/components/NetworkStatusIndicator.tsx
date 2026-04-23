"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { useNetworkStatusStore } from "@/lib/network-status-store";

/**
 * Props for NetworkStatusIndicator component
 */
interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  autoCheck?: boolean;
  checkInterval?: number;
  onStatusChange?: (status: string) => void;
}

/**
 * Animation variants for status indicator
 */
const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Animation variants for status badge
 */
const badgeVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.2 },
  },
};

/**
 * Animation variants for details panel
 */
const panelVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Connection type detector
 */
const getConnectionType = (): string => {
  if (typeof navigator === "undefined") return "unknown";

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  return connection?.effectiveType || "unknown";
};

/**
 * Status color mapper
 */
const getStatusColor = (
  status: string
): {
  dot: string;
  bg: string;
  text: string;
  label: string;
} => {
  const colors: Record<
    string,
    { dot: string; bg: string; text: string; label: string }
  > = {
    online: {
      dot: "bg-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Online",
    },
    offline: {
      dot: "bg-red-500",
      bg: "bg-red-50",
      text: "text-red-700",
      label: "Offline",
    },
    slow: {
      dot: "bg-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      label: "Slow",
    },
    checking: {
      dot: "bg-gray-400",
      bg: "bg-gray-50",
      text: "text-gray-700",
      label: "Checking...",
    },
  };

  return colors[status] || colors.checking;
};

/**
 * NetworkStatusIndicator Component
 *
 * Displays real-time network status with automatic monitoring.
 * Uses Zustand for state management and framer-motion for animations.
 * Includes latency measurement and connection type detection.
 */
export const NetworkStatusIndicator: React.FC<
  NetworkStatusIndicatorProps
> = ({
  showDetails = true,
  autoCheck = true,
  checkInterval = 30000, // 30 seconds
  onStatusChange,
}) => {
  const t = useTranslations();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Zustand store
  const {
    status,
    latency,
    connectionType,
    errorMessage,
    isMonitoring,
    setStatus,
    setConnectionType,
    setIsMonitoring,
    checkStatus,
  } = useNetworkStatusStore();

  /**
   * Initialize monitoring
   */
  useEffect(() => {
    if (!autoCheck) return;

    // Initial check
    checkStatus();
    setIsMonitoring(true);

    // Detect connection type
    const type = getConnectionType();
    setConnectionType(type);

    // Set up periodic checks
    intervalRef.current = setInterval(() => {
      checkStatus();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsMonitoring(false);
    };
  }, [autoCheck, checkInterval, checkStatus, setIsMonitoring, setConnectionType]);

  /**
   * Handle status changes
   */
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  /**
   * Handle online/offline events
   */
  useEffect(() => {
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setStatus]);

  const colors = getStatusColor(status);

  return (
    <motion.div
      className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label={t("network.status") || "Network Status"}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status indicator dot */}
          <div className="relative">
            {status === "checking" || status === "slow" ? (
              <motion.div
                className={`h-3 w-3 rounded-full ${colors.dot}`}
                variants={pulseVariants}
                animate="animate"
              />
            ) : (
              <div className={`h-3 w-3 rounded-full ${colors.dot}`} />
            )}
          </div>

          {/* Status label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              className="flex flex-col gap-1"
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span className={`text-sm font-medium ${colors.text}`}>
                {colors.label}
              </span>

              {showDetails && latency !== null && (
                <span className="text-xs text-gray-500">
                  {latency}ms
                  {connectionType && connectionType !== "unknown" && (
                    <span className="ml-2">({connectionType})</span>
                  )}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Refresh button */}
        <motion.button
          onClick={() => checkStatus()}
          className="rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t("network.refresh") || "Check network status"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.svg
            className="h-4 w-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={isMonitoring ? { rotate: 360 } : {}}
            transition={{
              duration: status === "checking" ? 1 : 2,
              repeat: status === "checking" ? Infinity : 0,
              ease: "linear",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </motion.svg>
        </motion.button>
      </div>

      {/* Detailed information panel */}
      {showDetails && (
        <AnimatePresence>
          {(errorMessage || latency) && (
            <motion.div
              className="mt-3 border-t border-gray-200 pt-3"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {latency !== null && (
                <div className="mb-2 text-xs text-gray-600">
                  <span className="font-medium">
                    {t("network.latency") || "Latency"}:
                  </span>{" "}
                  {latency}ms
                </div>
              )}

              {connectionType && connectionType !== "unknown" && (
                <div className="mb-2 text-xs text-gray-600">
                  <span className="font-medium">
                    {t("network.connection") || "Connection"}:
                  </span>{" "}
                  {connectionType}
                </div>
              )}

              {errorMessage && (
                <motion.div
                  className="rounded bg-red-50 p-2 text-xs text-red-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="font-medium">
                    {t("network.error") || "Error"}:
                  </span>{" "}
                  {errorMessage}
                </motion.div>
              )}

              {status === "online" && !errorMessage && (
                <div className="text-xs text-gray-500">
                  {t("network.lastChecked") || "Last checked"}:{" "}
                  {new Date().toLocaleTimeString()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default NetworkStatusIndicator;
