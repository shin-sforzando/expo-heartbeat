import { StatusBar } from "expo-status-bar";
import { StyleSheet, SafeAreaView } from "react-native";
import CameraPreview from "./components/CameraPreview";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <CameraPreview />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
