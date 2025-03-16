import {
    type CameraCapturedPicture,
    CameraView,
    useCameraPermissions,
} from "expo-camera";
import React, { useState, useRef, useEffect, type ReactElement } from "react";
import { Animated, Button, StyleSheet, Text, View } from "react-native";
import { HeartbeatDetector } from "../utils/heartbeat-detector";

// Constants
const CAPTURE_INTERVAL_MS = 200; // Interval between captures in milliseconds

export default function CameraPreview(): ReactElement {
    const [permission, requestPermission] = useCameraPermissions();
    const [isDetecting, setIsDetecting] = useState(false);
    const [heartRate, setHeartRate] = useState<number | null>(null);
    const [redValue, setRedValue] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [pictureSize, setPictureSize] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);
    const detectorRef = useRef(new HeartbeatDetector());
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Setup on component mount
    useEffect(() => {
        // Set callback for peak detection
        detectorRef.current.setOnPeakDetectedCallback(() => {
            pulseIndicator();
        });

        // Update BPM value periodically
        const bpmIntervalId = setInterval(() => {
            if (isDetecting && isMountedRef.current) {
                const bpm = detectorRef.current.getBPM();
                if (bpm !== null) {
                    setHeartRate(bpm);
                }
            }
        }, 1000);

        // Start or stop frame capture based on detection state
        if (isDetecting && isCameraReady) {
            startFrameCapture();
        } else {
            stopFrameCapture();
        }

        // Cleanup on unmount
        return () => {
            clearInterval(bpmIntervalId);
            stopFrameCapture();
            // Remove callback by setting an empty function
            detectorRef.current.setOnPeakDetectedCallback(() => {});
        };
    }, [isDetecting, isCameraReady]);

    // Handle camera ready state
    const handleCameraReady = async () => {
        setIsCameraReady(true);

        // Get available picture sizes
        if (cameraRef.current) {
            try {
                const sizes =
                    await cameraRef.current.getAvailablePictureSizesAsync();
                console.log("Available picture sizes:", sizes);

                // Find the smallest size
                if (0 < sizes.length) {
                    // Sort sizes by resolution (assuming format is "WIDTHxHEIGHT")
                    const sortedSizes = [...sizes].sort((a, b) => {
                        const [aWidth, aHeight] = a.split("x").map(Number);
                        const [bWidth, bHeight] = b.split("x").map(Number);
                        return aWidth * aHeight - bWidth * bHeight;
                    });

                    // Use the smallest size
                    setPictureSize(sortedSizes[0]);
                    console.log("Selected picture size:", sortedSizes[0]);
                }
            } catch (error) {
                console.error("Error getting available picture sizes:", error);
            }
        }

        // Start detection if it was already enabled
        if (isDetecting && !captureIntervalRef.current) {
            startFrameCapture();
        }
    };

    // Start capturing frames
    const startFrameCapture = () => {
        // Set a flag to track if capture process is active
        captureIntervalRef.current = setTimeout(() => {
            captureFrame();
        }, 0);
    };

    // Stop capturing frames
    const stopFrameCapture = () => {
        if (captureIntervalRef.current) {
            clearTimeout(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }
    };

    // Capture a single frame and schedule the next one after completion
    const captureFrame = async () => {
        // Skip if detection is stopped or component is unmounted
        if (!isDetecting || !isMountedRef.current || !isCameraReady) {
            return;
        }

        // Skip if already processing or camera is not available
        if (isProcessing || !cameraRef.current) {
            // Schedule next capture after a delay
            if (isDetecting && isMountedRef.current) {
                captureIntervalRef.current = setTimeout(() => {
                    captureFrame();
                }, CAPTURE_INTERVAL_MS);
            }
            return;
        }

        try {
            setIsProcessing(true);

            // Log capture timing
            console.log(`[${new Date().toISOString()}] Capturing photo...`);

            // Capture a photo with minimum quality and size
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.1, // Lowest quality for faster processing
                skipProcessing: true, // Skip additional processing
                shutterSound: false, // Disable shutter sound
                exif: false, // Don't include EXIF data
            });

            // Process the captured photo if it exists and component is still mounted
            if (photo && isMountedRef.current) {
                // Log successful capture
                console.log(
                    `[${new Date().toISOString()}] Photo captured: ${photo.width}x${photo.height}`,
                );

                // Process the photo
                processPhoto(photo);
            }
        } catch (error) {
            console.error("Error capturing photo:", error);
        } finally {
            // Reset processing flag if still mounted
            if (isMountedRef.current) {
                setIsProcessing(false);

                // Schedule next capture only if still detecting and mounted
                if (isDetecting && isMountedRef.current) {
                    captureIntervalRef.current = setTimeout(() => {
                        captureFrame();
                    }, CAPTURE_INTERVAL_MS);
                }
            }
        }
    };

    // Process a captured photo
    const processPhoto = (photo: CameraCapturedPicture) => {
        // Create a mock frame data for demonstration
        // In a real implementation, you would extract the actual pixel data from the photo
        const frameData = createMockFrameData(photo.width, photo.height);

        // For debugging: show red channel value
        const redAverage = extractRedChannelAverage(frameData);
        setRedValue(redAverage);

        // Process frame for heartbeat detection
        detectorRef.current.processFrame(frameData);
    };

    // Create mock frame data for demonstration
    const createMockFrameData = (width: number, height: number) => {
        // Create a mock Uint8Array with simulated pixel data
        const data = new Uint8Array(width * height * 4);

        // Fill with simulated values
        for (let i = 0; i < data.length; i += 4) {
            // Simulate pulsing red values (for demonstration only)
            const time = Date.now();
            const pulse = Math.sin(time / 500) * 20 + 200; // Simulate heartbeat

            // RGBA values
            data[i] = pulse; // Red (pulsing)
            data[i + 1] = 50; // Green
            data[i + 2] = 50; // Blue
            data[i + 3] = 255; // Alpha
        }

        return { width, height, data };
    };

    // Extract red channel average (for debugging)
    const extractRedChannelAverage = (frameData: {
        width: number;
        height: number;
        data: Uint8Array;
    }): number => {
        const { width, height, data } = frameData;

        // Calculate the center region of the image (middle 50%)
        const startX = Math.floor(width * 0.25);
        const endX = Math.floor(width * 0.75);
        const startY = Math.floor(height * 0.25);
        const endY = Math.floor(height * 0.75);

        let redSum = 0;
        let pixelCount = 0;

        // Iterate through the center region
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // Calculate the pixel index
                // Each pixel has 4 values: R, G, B, A
                const pixelIndex = (y * width + x) * 4;

                // Get the red channel value (index 0)
                const redValue = data[pixelIndex];

                redSum += redValue;
                pixelCount++;
            }
        }

        // Return the average red value
        return 0 < pixelCount ? redSum / pixelCount : 0;
    };

    // Animate the pulse indicator
    const pulseIndicator = () => {
        Animated.sequence([
            Animated.timing(pulseAnimation, {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Toggle heartbeat detection
    const toggleDetection = () => {
        if (isDetecting) {
            detectorRef.current.reset();
            setHeartRate(null);
            setRedValue(null);
        }
        setIsDetecting(!isDetecting);
    };

    // Camera permissions are still loading
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    Loading camera permissions...
                </Text>
            </View>
        );
    }

    // Camera permissions are not granted yet
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="Grant permission" />
            </View>
        );
    }

    // Render camera preview with heartbeat detection UI
    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                onCameraReady={handleCameraReady}
                animateShutter={false}
                pictureSize={pictureSize || undefined}
            />

            {/* Status and control overlay */}
            <View style={styles.overlay}>
                <Text style={styles.statusText}>
                    {isDetecting
                        ? heartRate
                            ? `Heart Rate: ${Math.round(heartRate)} BPM`
                            : "Detecting..."
                        : "Detection Stopped"}
                </Text>

                {/* Debug info */}
                {isDetecting && redValue !== null && (
                    <Text style={styles.debugText}>
                        Red Value: {redValue.toFixed(2)}
                    </Text>
                )}

                <Button
                    title={isDetecting ? "Stop Detection" : "Start Detection"}
                    onPress={toggleDetection}
                />
            </View>

            {/* Heartbeat indicator */}
            {isDetecting && (
                <Animated.View
                    style={[
                        styles.heartbeatIndicator,
                        {
                            transform: [{ scale: pulseAnimation }],
                            backgroundColor: "red",
                        },
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
    },
    message: {
        textAlign: "center",
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        alignItems: "center",
    },
    statusText: {
        color: "white",
        fontSize: 18,
        marginBottom: 10,
    },
    debugText: {
        color: "white",
        fontSize: 14,
        marginBottom: 10,
    },
    heartbeatIndicator: {
        width: 50,
        height: 50,
        borderRadius: 25,
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
    },
});
