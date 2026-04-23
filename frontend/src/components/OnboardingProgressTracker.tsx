"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Step interface for onboarding progress
 */
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

/**
 * Props for OnboardingProgressTracker component
 */
interface OnboardingProgressTrackerProps {
  steps: OnboardingStep[];
  currentStep?: string;
  onStepChange?: (stepId: string) => void;
  onComplete?: () => void;
  showStepNumbers?: boolean;
  orientation?: "vertical" | "horizontal";
  compact?: boolean;
}

/**
 * Animation variants for step container
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Animation variants for individual steps
 */
const stepVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

/**
 * Animation variants for progress bar
 */
const progressBarVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Animation variants for check mark
 */
const checkMarkVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.2,
    },
  },
};

/**
 * OnboardingProgressTracker Component
 *
 * Displays onboarding progress with comprehensive accessibility support.
 * Includes proper ARIA labels, semantic HTML, and screen reader announcements.
 * Features animations for visual feedback and status tracking.
 */
export const OnboardingProgressTracker: React.FC<
  OnboardingProgressTrackerProps
> = ({
  steps,
  currentStep: currentStepProp,
  onStepChange,
  onComplete,
  showStepNumbers = true,
  orientation = "vertical",
  compact = false,
}) => {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState<string | undefined>(
    currentStepProp || steps[0]?.id
  );
  const [announcementText, setAnnouncementText] = useState<string>("");

  /**
   * Sort steps by order
   */
  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.order - b.order),
    [steps]
  );

  /**
   * Calculate progress percentage
   */
  const progressPercentage = useMemo(() => {
    const completedCount = sortedSteps.filter((s) => s.completed).length;
    return Math.round((completedCount / sortedSteps.length) * 100);
  }, [sortedSteps]);

  /**
   * Calculate estimated completion status
   */
  const isOnboardingComplete = useMemo(() => {
    const requiredSteps = sortedSteps.filter((s) => s.required);
    return requiredSteps.every((s) => s.completed);
  }, [sortedSteps]);

  /**
   * Handle step click with accessibility announcement
   */
  const handleStepClick = useCallback(
    (stepId: string) => {
      const step = sortedSteps.find((s) => s.id === stepId);
      if (!step) return;

      setCurrentStep(stepId);
      onStepChange?.(stepId);

      // Announce to screen readers
      const announcement = `${t("onboarding.stepProgress") || "Step"} ${step.order}: ${step.title}. ${step.description}`;
      setAnnouncementText(announcement);
    },
    [sortedSteps, onStepChange, t]
  );

  /**
   * Handle onboarding completion
   */
  useEffect(() => {
    if (isOnboardingComplete && sortedSteps.length > 0) {
      const announcement = t("onboarding.completed") || "Onboarding completed";
      setAnnouncementText(announcement);
      onComplete?.();
    }
  }, [isOnboardingComplete, sortedSteps.length, onComplete, t]);

  /**
   * Announce status changes at intervals
   */
  useEffect(() => {
    const StatusMessage = `${t("onboarding.progress") || "Progress"}: ${progressPercentage}% complete`;
    setAnnouncementText(StatusMessage);
  }, [progressPercentage, t]);

  return (
    <div
      className="w-full"
      role="region"
      aria-label={t("onboarding.progressTracker") || "Onboarding Progress"}
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Screen reader announcement area */}
      <div
        className="sr-only"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {announcementText}
      </div>

      {/* Container */}
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${
          compact ? "p-4" : ""
        }`}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("onboarding.title") || "Onboarding Progress"}
            </h2>
            <span className="text-sm font-medium text-gray-600">
              {progressPercentage}%
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {t("onboarding.subtitle") ||
              "Complete all required steps to finish setup"}
          </p>

          {/* Overall progress bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              variants={progressBarVariants}
              initial="hidden"
              animate="visible"
              style={{ width: `${progressPercentage}%` }}
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                t("onboarding.progressBar") || "Overall progress"
              }
            />
          </div>

          {/* Status text */}
          <p className="mt-2 text-xs text-gray-500">
            {sortedSteps.filter((s) => s.completed).length} of{" "}
            {sortedSteps.length} steps completed
            {isOnboardingComplete && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600 font-medium">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("onboarding.allCompleted") || "All done!"}
              </span>
            )}
          </p>
        </div>

        {/* Steps list */}
        <motion.div
          className={`space-y-3 ${
            orientation === "horizontal" ? "flex gap-4" : ""
          }`}
          role="list"
          aria-label={t("onboarding.stepsList") || "Onboarding steps"}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {sortedSteps.map((step, index) => {
              const isCurrentStep = currentStep === step.id;
              const isPastStep = sortedSteps.findIndex((s) => s.id === currentStep) > index;

              return (
                <motion.div
                  key={step.id}
                  role="listitem"
                  variants={stepVariants}
                  className={`flex gap-4 ${
                    orientation === "horizontal"
                      ? "flex-1 flex-col"
                      : "flex-row"
                  }`}
                >
                  {/* Step indicator */}
                  <button
                    onClick={() => handleStepClick(step.id)}
                    className={`relative flex-shrink-0 ${
                      compact ? "h-8 w-8" : "h-10 w-10"
                    } rounded-full border-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      step.completed
                        ? "border-green-500 bg-green-50"
                        : isCurrentStep
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-gray-50 hover:border-gray-400"
                    }`}
                    aria-label={`Step ${showStepNumbers ? index + 1 : ""}: ${step.title}${
                      step.completed ? ". Completed" : ""
                    }${step.required ? ". Required" : ""}`}
                    aria-pressed={isCurrentStep}
                    aria-current={isCurrentStep ? "step" : undefined}
                    disabled={false}
                  >
                    <AnimatePresence mode="wait">
                      {step.completed ? (
                        <motion.div
                          key="checkmark"
                          className="absolute inset-0 flex items-center justify-center"
                          variants={checkMarkVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <svg
                            className="h-5 w-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          className={`text-${compact ? "sm" : "base"} ${
                            isCurrentStep
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {showStepNumbers ? index + 1 : ""}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Step content */}
                  <motion.div
                    className="flex-1 min-w-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3
                      className={`font-medium text-gray-900 ${
                        step.completed ? "text-green-700 line-through" : ""
                      } ${compact ? "text-sm" : "text-base"}`}
                    >
                      {step.title}
                      {step.required && (
                        <span
                          className="ml-1 text-red-500"
                          aria-label="Required"
                          title="Required step"
                        >
                          *
                        </span>
                      )}
                    </h3>
                    <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm"}`}>
                      {step.description}
                    </p>

                    {/* Status badge */}
                    <div className="mt-2 flex items-center gap-2">
                      <motion.span
                        className={`inline-flex text-xs font-semibold rounded-full px-2 py-1 ${
                          step.completed
                            ? "bg-green-100 text-green-800"
                            : isCurrentStep
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        {step.completed
                          ? t("onboarding.completed") || "Completed"
                          : isCurrentStep
                            ? t("onboarding.inProgress") || "In Progress"
                            : t("onboarding.pending") || "Pending"}
                      </motion.span>
                    </div>
                  </motion.div>

                  {/* Connector line (vertical orientation only) */}
                  {orientation === "vertical" &&
                    index < sortedSteps.length - 1 && (
                      <div className="absolute left-5 top-10 h-3 w-0.5 bg-gray-200" />
                    )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Completion message */}
        <AnimatePresence>
          {isOnboardingComplete && sortedSteps.length > 0 && (
            <motion.div
              className="mt-6 rounded-lg bg-green-50 p-4 border border-green-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <motion.svg
                  className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </motion.svg>
                <div>
                  <h4 className="font-semibold text-green-900">
                    {t("onboarding.successTitle") || "Onboarding Complete!"}
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    {t("onboarding.successMessage") ||
                      "You have successfully completed all required onboarding steps."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingProgressTracker;
