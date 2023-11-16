import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { API_KEY } from "@env";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [labels, setLabels] = useState([]);

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
    setLabels([]);
    if (cameraRef) {
      try {
        let photo = await cameraRef.current.takePictureAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!photo.canceled) {
          console.log(photo.uri);
          setPhotoUri(photo.uri);
          toggleCamera();
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  const analyzePhoto = async () => {
    try {
      if (!photoUri) {
        alert("Please take a photo first.");
        return;
      }

      const apiKey = API_KEY;
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      const base64ImageData = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestData = {
        requests: [
          {
            image: {
              content: base64ImageData,
            },
            features: [{ type: "LABEL_DETECTION", maxResults: 3 }],
          },
        ],
      };

      const apiResponse = await axios.post(apiUrl, requestData);
      setLabels(apiResponse.data.responses[0].labelAnnotations);
    } catch (error) {
      console.error("Error analyzing photo:", error);
      alert("Error analyzing photo. Please try again later.");
    }
  };

  return (
    <View style={styles.container}>
      {isCameraVisible ? (
        <View style={styles.cameraWrapper}>
          <View style={styles.cameraUiCloseContainer}>
            <TouchableOpacity
              style={styles.closeCameraButton}
              onPress={toggleCamera}
            >
              <Icon
                style={styles.closeCameraButtonIcon}
                name="arrow-left"
                size={28}
              />
            </TouchableOpacity>
          </View>
          <Camera
            style={styles.camera}
            type={type}
            ref={cameraRef}
            aspect={16 / 9}
          ></Camera>
          <View style={styles.cameraUiContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={async () => takePhoto()}
            >
              <Icon style={styles.cameraButtonIcon} name="circle" size={64} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCamera}>
            <Icon style={styles.buttonText} name="camera" size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={analyzePhoto}>
            <Icon style={styles.buttonText} name="search" size={32} />
          </TouchableOpacity>
          <View>
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={{ width: 300, height: 300, marginBottom: 20 }}
              />
            )}
            {labels.length > 0 && (
              <View>
                <Text style={styles.labelHeader}>Labels:</Text>
                {labels.map((label, index) => (
                  <View key={index} style={styles.labelContainer}>
                    <Text style={styles.labelText}>
                      {label.description}: {label.score.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
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

  cameraWrapper: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraUiContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    bottom: 34,
    rowGap: 50,
  },

  cameraUiCloseContainer: {
    position: "absolute",
    top: 60,
    left: 50,
  },

  camera: {
    height: "70%",
    aspectRatio: 3 / 4,
  },

  cameraButtonIcon: {
    color: "#fafafa",
  },

  closeCameraButtonIcon: {
    color: "#fafafa",
  },

  buttonsContainer: {
    rowGap: 100,
  },
});
