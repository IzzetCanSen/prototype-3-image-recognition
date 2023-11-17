import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { API_KEY } from "@env";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

      setIsLoading(true);
      console.log("Loading started");

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
    } finally {
      setIsLoading(false);
      console.log("Loading finished");
    }
  };

  const deletePhoto = () => {
    setPhotoUri(null);
    setLabels([]);
  };

  return (
    <View style={styles.containerr}>
      {isCameraVisible ? (
        <View style={styles.cameraWrapper}>
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
        <View style={styles.mainContainer}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCamera}>
              <Icon style={styles.iconButton} name="camera" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={analyzePhoto}>
              <MaterialCommunityIcons
                style={styles.iconButton}
                name="face-recognition"
                size={22}
              />
            </TouchableOpacity>
          </View>
          <View>
            {photoUri && (
              <View>
                <Image source={{ uri: photoUri }} style={styles.image} />
                {isLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FAF9FB" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deletePhotoButtonContainer}
                  onPress={deletePhoto}
                >
                  <MaterialCommunityIcons
                    style={styles.deletePhotoButton}
                    name="delete"
                    size={24}
                  />
                </TouchableOpacity>
              </View>
            )}
            {labels.length > 0 && (
              <View style={styles.labelsContainer}>
                {labels.map((label, index) => (
                  <View key={index} style={styles.labelContainer}>
                    <Text style={styles.labelText}>{label.description}</Text>
                    <Text style={styles.labelText}>
                      {(label.score * 100).toFixed(0)}%
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
  containerr: {
    flex: 1,
    backgroundColor: "#FAF9FB",
    alignItems: "center",
  },

  mainContainer: {
    flex: 1,
    width: "90%",
    marginTop: 75,
  },

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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  button: {
    width: "48%",
    backgroundColor: "#5B1D8A",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
  },

  iconButton: {
    color: "#FAF9FB",
  },

  image: {
    aspectRatio: 3 / 4,
    borderRadius: 15,
  },

  deletePhotoButtonContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },

  deletePhotoButton: {
    color: "#FAF9FB",
  },

  labelsContainer: {
    rowGap: 10,
    backgroundColor: "#5B1D8A",
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
  },

  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#5B1D8A",
    padding: 10,
    borderRadius: 15,
  },

  labelText: {
    color: "#FAF9FB",
    fontSize: 14,
    fontWeight: "700",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
  },
});
