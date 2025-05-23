import { CameraView, useCameraPermissions } from "expo-camera";
import React, { type ReactElement } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function CameraPreview(): ReactElement {
    const [permission, requestPermission] = useCameraPermissions();

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

    // Render camera preview if permission is granted
    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} />
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
});
