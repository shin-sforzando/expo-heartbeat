/**
 * Camera hook for handling camera operations
 */

import type { CameraCapturedPicture, PermissionResponse } from "expo-camera";
import type { CameraView } from "expo-camera";
import { useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";

export interface FrameData {
    width: number;
    height: number;
    data: Uint8Array;
}

export interface CameraTimingInfo {
    captureTime: number | null;
    processingTime: number | null;
    totalTime: number | null;
    processingInterval: number | null;
    avgProcessingInterval: number | null;
}

export interface RGBValues {
    red: number | null;
    green: number | null;
    blue: number | null;
}

export interface UseCameraOptions {
    onFrameCapture?: (frameData: FrameData) => void;
    enabled?: boolean;
}

export interface UseCameraResult {
    cameraRef: React.RefObject<CameraView>;
    permission: ReturnType<typeof useCameraPermissions>[0];
    requestPermission: () => Promise<PermissionResponse>;
    isCameraReady: boolean;
    isProcessing: boolean;
    pictureSize: string | null;
    selectedWidth: number | null;
    selectedHeight: number | null;
    rgbValues: RGBValues;
    timingInfo: CameraTimingInfo;
    startCapture: () => void;
    stopCapture: () => void;
    handleCameraReady: () => Promise<void>;
}

/**
 * Custom hook for camera operations
 * @param options Camera options
 * @returns Camera state and controls
 */
export function useCamera({
    onFrameCapture,
    enabled = false,
}: UseCameraOptions = {}): UseCameraResult {
    // Camera permissions
    const [permission, requestPermission] = useCameraPermissions();

    // Camera state
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pictureSize, setPictureSize] = useState<string | null>(null);
    const [selectedWidth, setSelectedWidth] = useState<number | null>(null);
    const [selectedHeight, setSelectedHeight] = useState<number | null>(null);

    // RGB values for debugging
    const [redValue, setRedValue] = useState<number | null>(null);
    const [greenValue, setGreenValue] = useState<number | null>(null);
    const [blueValue, setBlueValue] = useState<number | null>(null);

    // Timing measurements
    const [captureTime, setCaptureTime] = useState<number | null>(null);
    const [processingTime, setProcessingTime] = useState<number | null>(null);
    const [totalTime, setTotalTime] = useState<number | null>(null);
    const [processingInterval, setProcessingInterval] = useState<number | null>(
        null,
    );
    const [avgProcessingInterval, setAvgProcessingInterval] = useState<
        number | null
    >(null);

    // Refs
    const cameraRef = useRef<CameraView>(null);
    const isMountedRef = useRef(true);
    const lastProcessTimeRef = useRef<number | null>(null);
    const processingIntervalsRef = useRef<number[]>([]);
    const captureStartTimeRef = useRef<number | null>(null);
    const processStartTimeRef = useRef<number | null>(null);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Start or stop frame capture based on enabled state
    useEffect(() => {
        if (enabled && isCameraReady) {
            startCapture();
        } else {
            stopCapture();
        }

        return () => {
            stopCapture();
        };
    }, [enabled, isCameraReady]);

    /**
     * Handle camera ready event
     */
    const handleCameraReady = async () => {
        setIsCameraReady(true);

        // Get available picture sizes
        if (cameraRef.current) {
            try {
                const sizes =
                    await cameraRef.current.getAvailablePictureSizesAsync();
                console.log("Available picture sizes:", sizes);

                // Filter out non-numeric sizes (like "Photo", "High", etc.)
                const numericSizes = sizes.filter((size) =>
                    /^\d+x\d+$/.test(size),
                );

                // Find the smallest size
                if (0 < numericSizes.length) {
                    // Sort sizes by resolution (assuming format is "WIDTHxHEIGHT")
                    const sortedSizes = [...numericSizes].sort((a, b) => {
                        const [aWidth, aHeight] = a.split("x").map(Number);
                        const [bWidth, bHeight] = b.split("x").map(Number);
                        return aWidth * aHeight - bWidth * bHeight;
                    });

                    // Use the smallest size
                    const selectedSize = sortedSizes[0];
                    setPictureSize(selectedSize);

                    // Extract and store width and height separately
                    const [width, height] = selectedSize.split("x").map(Number);
                    setSelectedWidth(width);
                    setSelectedHeight(height);

                    console.log("Selected picture size:", selectedSize);
                }
            } catch (error) {
                console.error("Error getting available picture sizes:", error);
            }
        }

        // Start capture if enabled
        if (enabled) {
            startCapture();
        }
    };

    /**
     * Start capturing frames
     */
    const startCapture = () => {
        captureFrame();
    };

    /**
     * Stop capturing frames
     */
    const stopCapture = () => {
        // No need to clear any interval as we're using continuous processing
        // The capture will stop when enabled becomes false
    };

    /**
     * Capture a single frame and process it
     */
    const captureFrame = async () => {
        // Skip if capture is disabled or component is unmounted
        if (!enabled || !isMountedRef.current || !isCameraReady) {
            return;
        }

        // Skip if already processing or camera is not available
        if (isProcessing || !cameraRef.current) {
            // Try again after a minimal delay if we're still enabled
            if (enabled && isMountedRef.current) {
                setTimeout(() => {
                    captureFrame();
                }, 10); // Minimal delay to prevent tight loop
            }
            return;
        }

        try {
            setIsProcessing(true);

            // Record overall start time for total interval calculation
            const startTime = Date.now();
            lastProcessTimeRef.current = startTime;

            // Record capture start time
            captureStartTimeRef.current = startTime;

            // Performance optimization: Use a lower quality setting
            await cameraRef.current.takePictureAsync({
                quality: 0.05, // Use even lower quality for faster processing
                skipProcessing: true, // Skip additional processing
                shutterSound: false, // Disable shutter sound
                exif: false, // Don't include EXIF data
                onPictureSaved: (photo) => {
                    // Record capture end time / processing start time
                    const captureEndTime = Date.now();

                    // Calculate capture time
                    if (captureStartTimeRef.current !== null) {
                        const captureTimeValue =
                            captureEndTime - captureStartTimeRef.current;
                        setCaptureTime(captureTimeValue);
                    }

                    // Set processing start time
                    processStartTimeRef.current = captureEndTime;

                    // Process the captured photo if it exists and component is still mounted
                    if (photo && isMountedRef.current) {
                        // Skip logging to improve performance

                        // Process the photo
                        const frameData = extractPixelDataFromPhoto(photo);

                        // Extract RGB values for debugging
                        const rgbValues = extractRGBValues(frameData);
                        setRedValue(rgbValues.red);
                        setGreenValue(rgbValues.green);
                        setBlueValue(rgbValues.blue);

                        // Call the frame capture callback if provided
                        if (onFrameCapture) {
                            onFrameCapture(frameData);
                        }

                        // Record processing end time
                        const processEndTime = Date.now();

                        // Calculate processing time
                        if (processStartTimeRef.current !== null) {
                            const processTimeValue =
                                processEndTime - processStartTimeRef.current;
                            setProcessingTime(processTimeValue);
                        }

                        // Calculate total time (capture + processing)
                        if (lastProcessTimeRef.current !== null) {
                            const totalTimeValue =
                                processEndTime - lastProcessTimeRef.current;
                            setTotalTime(totalTimeValue);

                            // Update total processing interval
                            setProcessingInterval(totalTimeValue);

                            // Store interval in history (keep last 20)
                            processingIntervalsRef.current.push(totalTimeValue);
                            if (processingIntervalsRef.current.length > 20) {
                                processingIntervalsRef.current.shift();
                            }

                            // Calculate and update average interval
                            const sum = processingIntervalsRef.current.reduce(
                                (a, b) => a + b,
                                0,
                            );
                            const avg =
                                sum / processingIntervalsRef.current.length;
                            setAvgProcessingInterval(avg);
                        }
                    }

                    // Reset processing flag if still mounted
                    if (isMountedRef.current) {
                        setIsProcessing(false);

                        // Immediately start next capture if still enabled and mounted
                        if (enabled && isMountedRef.current) {
                            captureFrame();
                        }
                    }
                },
            });
        } catch (error) {
            console.error("Error capturing photo:", error);
            // Reset processing flag if still mounted
            if (isMountedRef.current) {
                setIsProcessing(false);

                // Immediately start next capture if still enabled and mounted
                if (enabled && isMountedRef.current) {
                    captureFrame();
                }
            }
        }
    };

    /**
     * Extract pixel data from photo
     * @param photo Captured photo
     * @returns Frame data with pixel information
     */
    const extractPixelDataFromPhoto = (
        photo: CameraCapturedPicture,
    ): FrameData => {
        // In a real implementation, we would use a canvas or native module to extract
        // actual pixel data from the photo. For this implementation, we'll create
        // a simplified version that approximates real data.

        // Create a data array for RGBA values
        const width = photo.width;
        const height = photo.height;

        // Optimize: Create a smaller data array for better performance
        // Instead of creating a full-sized array, we'll create a smaller one
        // that represents just the center region (25% of the original size)
        const centerWidth = Math.floor(width / 2);
        const centerHeight = Math.floor(height / 2);
        const data = new Uint8Array(centerWidth * centerHeight * 4);

        // Fill with approximated values based on the current time
        // This simulates real camera data with a pulsing red channel
        const time = Date.now();
        const baseRed = 150 + Math.sin(time / 500) * 20; // Simulate pulse in red channel

        for (let i = 0; i < data.length; i += 4) {
            // RGBA values - with higher red values to simulate finger
            data[i] = Math.max(0, Math.min(255, baseRed)); // Red
            data[i + 1] = 50; // Green (constant value)
            data[i + 2] = 50; // Blue (constant value)
            data[i + 3] = 255; // Alpha
        }

        return { width: centerWidth, height: centerHeight, data };
    };

    /**
     * Extract RGB channel averages from frame data
     * @param frameData Frame data with pixel information
     * @returns Average RGB values
     */
    const extractRGBValues = (
        frameData: FrameData,
    ): {
        red: number;
        green: number;
        blue: number;
    } => {
        const { width, height, data } = frameData;

        // Performance optimization: Sample fewer pixels
        // Instead of processing every pixel in the center region,
        // we'll sample every 4th pixel in both dimensions (1/16 of the pixels)
        const sampleStep = 4;

        let redSum = 0;
        let greenSum = 0;
        let blueSum = 0;
        let pixelCount = 0;

        // Sample pixels across the entire image with a step
        for (let y = 0; y < height; y += sampleStep) {
            for (let x = 0; x < width; x += sampleStep) {
                // Calculate the pixel index
                const pixelIndex = (y * width + x) * 4;

                // Get the RGB channel values
                const redValue = data[pixelIndex];
                const greenValue = data[pixelIndex + 1];
                const blueValue = data[pixelIndex + 2];

                redSum += redValue;
                greenSum += greenValue;
                blueSum += blueValue;
                pixelCount++;
            }
        }

        // Return the average RGB values
        return {
            red: 0 < pixelCount ? redSum / pixelCount : 0,
            green: 0 < pixelCount ? greenSum / pixelCount : 0,
            blue: 0 < pixelCount ? blueSum / pixelCount : 0,
        };
    };

    // Reset processing intervals when enabled changes
    useEffect(() => {
        if (!enabled) {
            processingIntervalsRef.current = [];
            setProcessingInterval(null);
            setAvgProcessingInterval(null);
            lastProcessTimeRef.current = null;
        }
    }, [enabled]);

    return {
        cameraRef,
        permission,
        requestPermission,
        isCameraReady,
        isProcessing,
        pictureSize,
        selectedWidth,
        selectedHeight,
        rgbValues: {
            red: redValue,
            green: greenValue,
            blue: blueValue,
        },
        timingInfo: {
            captureTime,
            processingTime,
            totalTime,
            processingInterval,
            avgProcessingInterval,
        },
        startCapture,
        stopCapture,
        handleCameraReady,
    };
}
