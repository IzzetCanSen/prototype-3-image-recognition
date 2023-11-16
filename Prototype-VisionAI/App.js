import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { Camera } from "expo-camera";
import Icon from "react-native-vector-icons/FontAwesome";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status == "granted");
    })();
  }, []);

  const toggleCamera = () => {
    setIsCameraVisible(!isCameraVisible);
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>This is the Photo Page</Text>;
  }

  const takePhoto = async () => {
    if (cameraRef) {
      try {
        let photo = await cameraRef.current.takePictureAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
        return photo;
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <View style={styles.container}>
      {isCameraVisible ? (
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <View style={styles.cameraUiContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={async () => {
                const r = await takePhoto();
                Alert.alert("test", JSON.stringify(r));
              }}
            >
              <Icon style={styles.cameraButtonIcon} name="camera" size={42} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeCameraButton}
              onPress={toggleCamera}
            >
              <Icon
                style={styles.closeCameraButtonIcon}
                name="close"
                size={24}
              />
            </TouchableOpacity>
          </View>
        </Camera>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCamera}>
            <Icon style={styles.buttonText} name="camera" size={24} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraUiContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    bottom: 50,
    rowGap: 50,
  },

  camera: {
    width: "100%",
    height: "100%",
  },
});
