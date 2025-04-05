/**
 * HeartbeatMonitor component
 * Main component for heartbeat detection
 */

import React, { useState, useRef, type ReactElement } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useCamera } from "../hooks/useCamera";
import { useHeartbeatDetection } from "../hooks/useHeartbeatDetection";
import DebugInfo from "./DebugInfo";
import HeartbeatDisplay from "./HeartbeatDisplay";
import SimpleCameraPreview from "./SimpleCameraPreview";

/**
 * Main component for heartbeat monitoring
 */
export default function HeartbeatMonitor(): ReactElement {
    // State
    const [isDetecting, setIsDetecting] = useState(false);
    // Always show debug info

    // Camera hook
    const {
        cameraRef,
        permission,
        requestPermission,
        rgbValues,
        timingInfo,
        handleCameraReady,
    } = useCamera({
        enabled: isDetecting,
        onFrameCapture: (frameData) => {
            heartbeat.processFrame(frameData);
        },
    });

    // Reference to the pulse indicator function
    const pulseIndicatorRef = useRef<(() => void) | null>(null);

    // Heartbeat detection hook
    const heartbeat = useHeartbeatDetection({
        enabled: isDetecting,
        onPeakDetected: () => {
            // Call the pulse indicator function when a peak is detected
            if (pulseIndicatorRef.current) {
                pulseIndicatorRef.current();
            }
        },
    });

    // Toggle heartbeat detection
    const toggleDetection = () => {
        if (isDetecting) {
            heartbeat.reset();
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

    return (
        <View style={styles.container}>
            {/* Camera Preview */}
            <SimpleCameraPreview
                cameraRef={cameraRef}
                onCameraReady={handleCameraReady}
                pictureSize={undefined}
            />

            {/* Debug Info - Always visible */}
            <DebugInfo
                visible={true}
                rgbValues={rgbValues}
                timingInfo={timingInfo}
            />

            {/* Heartbeat Display */}
            <HeartbeatDisplay
                heartRate={heartbeat.heartRate}
                isDetecting={isDetecting}
                onToggleDetection={toggleDetection}
                pulseIndicatorRef={pulseIndicatorRef}
            />
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
});
