/**
 * Heartbeat detection hook
 * Processes camera frames to detect heartbeats and calculate BPM
 */

import { useEffect, useRef, useState } from "react";
import { type FrameData, HeartbeatDetector } from "../utils/heartbeat-detector";

export interface UseHeartbeatDetectionOptions {
    onPeakDetected?: () => void;
    enabled?: boolean;
}

export interface UseHeartbeatDetectionResult {
    processFrame: (frameData: FrameData) => void;
    heartRate: number | null;
    reset: () => void;
}

/**
 * Custom hook for heartbeat detection
 * @param options Heartbeat detection options
 * @returns Heartbeat detection state and controls
 */
export function useHeartbeatDetection({
    onPeakDetected,
    enabled = false,
}: UseHeartbeatDetectionOptions = {}): UseHeartbeatDetectionResult {
    // State
    const [heartRate, setHeartRate] = useState<number | null>(null);

    // Refs
    const detectorRef = useRef(new HeartbeatDetector());
    const isMountedRef = useRef(true);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Set up peak detection callback
    useEffect(() => {
        if (onPeakDetected) {
            detectorRef.current.setOnPeakDetectedCallback(onPeakDetected);
        } else {
            detectorRef.current.setOnPeakDetectedCallback(() => {});
        }

        return () => {
            detectorRef.current.setOnPeakDetectedCallback(() => {});
        };
    }, [onPeakDetected]);

    // Update BPM value periodically
    useEffect(() => {
        if (!enabled) {
            setHeartRate(null);
            return;
        }

        const intervalId = setInterval(() => {
            if (enabled && isMountedRef.current) {
                const bpm = detectorRef.current.getBPM();
                if (bpm !== null) {
                    setHeartRate(bpm);
                }
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [enabled]);

    /**
     * Process a frame for heartbeat detection
     * @param frameData Frame data with pixel information
     */
    const processFrame = (frameData: FrameData) => {
        if (enabled && isMountedRef.current) {
            detectorRef.current.processFrame(frameData);
        }
    };

    /**
     * Reset the detector
     */
    const reset = () => {
        detectorRef.current.reset();
        setHeartRate(null);
    };

    return {
        processFrame,
        heartRate,
        reset,
    };
}
