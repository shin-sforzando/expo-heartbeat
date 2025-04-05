/**
 * SimpleCameraPreview component
 * Displays camera preview without additional logic
 */

import { CameraView } from "expo-camera";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

export interface SimpleCameraPreviewProps {
    /**
     * Reference to the camera view
     */
    cameraRef: React.RefObject<CameraView>;

    /**
     * Callback when camera is ready
     */
    onCameraReady: () => void;

    /**
     * Picture size for the camera
     */
    pictureSize?: string;
}

/**
 * Simple camera preview component
 */
export default function SimpleCameraPreview({
    cameraRef,
    onCameraReady,
    pictureSize,
}: SimpleCameraPreviewProps): ReactElement {
    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                onCameraReady={onCameraReady}
                animateShutter={false}
                pictureSize={pictureSize}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
});
