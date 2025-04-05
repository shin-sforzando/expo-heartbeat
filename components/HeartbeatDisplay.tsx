/**
 * HeartbeatDisplay component
 * Displays heartbeat information and animations
 */

import { type ReactElement, useCallback, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export interface HeartbeatDisplayProps {
    /**
     * Current heart rate in BPM
     */
    heartRate: number | null;

    /**
     * Whether heartbeat detection is active
     */
    isDetecting: boolean;

    /**
     * Callback for toggling detection
     */
    onToggleDetection: () => void;

    /**
     * Reference to the pulse animation function
     * This will be called by the parent component when a peak is detected
     */
    pulseIndicatorRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Component for displaying heartbeat information and animations
 */
export default function HeartbeatDisplay({
    heartRate,
    isDetecting,
    onToggleDetection,
    pulseIndicatorRef,
}: HeartbeatDisplayProps): ReactElement {
    // Animation for pulse indicator
    const pulseAnimation = useRef(new Animated.Value(1)).current;

    /**
     * Animate the pulse indicator
     */
    const pulseIndicator = useCallback(() => {
        if (!isDetecting) return;

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
    }, [isDetecting, pulseAnimation]);

    // Expose the pulse indicator function to the parent component
    useEffect(() => {
        if (pulseIndicatorRef) {
            pulseIndicatorRef.current = pulseIndicator;
        }

        return () => {
            if (pulseIndicatorRef) {
                pulseIndicatorRef.current = null;
            }
        };
    }, [pulseIndicatorRef, pulseIndicator]);

    return (
        <>
            {/* Status and control overlay */}
            <View style={styles.overlay}>
                <Text style={styles.statusText}>
                    {isDetecting
                        ? heartRate
                            ? `Heart Rate: ${Math.round(heartRate)} BPM`
                            : "Detecting..."
                        : "Detection Stopped"}
                </Text>

                <Text style={styles.toggleButton} onPress={onToggleDetection}>
                    {isDetecting ? "Stop Detection" : "Start Detection"}
                </Text>
            </View>

            {/* Heartbeat indicator */}
            {isDetecting && (
                <Animated.View
                    style={[
                        styles.heartbeatIndicator,
                        {
                            transform: [{ scale: pulseAnimation }],
                        },
                    ]}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        bottom: 0,
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
    toggleButton: {
        color: "white",
        backgroundColor: "#007AFF",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        overflow: "hidden",
    },
    heartbeatIndicator: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "red",
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
    },
});
