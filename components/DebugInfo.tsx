/**
 * DebugInfo component
 * Displays debug information for heartbeat detection
 */

import React, { type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CameraTimingInfo, RGBValues } from "../hooks/useCamera";

export interface DebugInfoProps {
    /**
     * Whether to show debug information
     */
    visible: boolean;

    /**
     * RGB values from camera
     */
    rgbValues: RGBValues;

    /**
     * Timing information for camera processing
     */
    timingInfo: CameraTimingInfo;
}

/**
 * Component for displaying debug information
 */
export default function DebugInfo({
    visible,
    rgbValues,
    timingInfo,
}: DebugInfoProps): ReactElement | null {
    // Don't render if not visible
    if (!visible) {
        return null;
    }

    const { red, green, blue } = rgbValues;
    const { captureTime, processingTime, totalTime, avgProcessingInterval } =
        timingInfo;

    return (
        <View style={styles.container}>
            {/* RGB values */}
            {red !== null && green !== null && blue !== null && (
                <>
                    <Text style={styles.text}>Red: {red.toFixed(2)}</Text>
                    <Text style={styles.text}>Green: {green.toFixed(2)}</Text>
                    <Text style={styles.text}>Blue: {blue.toFixed(2)}</Text>
                </>
            )}

            {/* Capture and processing times */}
            {captureTime !== null && (
                <Text style={styles.text}>Capture: {captureTime} ms</Text>
            )}

            {processingTime !== null && (
                <Text style={styles.text}>Processing: {processingTime} ms</Text>
            )}

            {totalTime !== null && (
                <Text style={styles.text}>
                    Total: {totalTime} ms ({(1000 / totalTime).toFixed(1)} Hz)
                </Text>
            )}

            {/* Average processing interval */}
            {avgProcessingInterval !== null && (
                <Text style={styles.text}>
                    Avg: {avgProcessingInterval.toFixed(1)} ms (
                    {(1000 / avgProcessingInterval).toFixed(1)} Hz)
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        alignItems: "center",
    },
    text: {
        color: "white",
        fontSize: 14,
        marginBottom: 5,
    },
});
