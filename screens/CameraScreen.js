import { View, Text, StyleSheet, SafeAreaView, Image, StatusBar, Button, Touchable, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Camera } from 'expo-camera';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import * as SQLite from 'expo-sqlite';
import Icon from 'react-native-vector-icons/Ionicons';

const db = SQLite.openDatabase('imageGallery.db');

const CameraScreen = () => {

    const cameraRef = useRef(null);

    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(false);
    const [locationPermission, setLocationPermission] = useState(null);
    const [location, setLocation] = useState(null);
    const [photo, setPhoto] = useState(null);

    useEffect(() => {

        // Requesting permissions from user
        const getPermissions = async () => {
            const cameraPermission = await Camera.requestCameraPermissionsAsync();
            const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
            const locationPermission = await Location.requestForegroundPermissionsAsync();

            if (cameraPermission.status === "granted") {
                setHasCameraPermission(true);
            } else {
                setHasCameraPermission(false);
            }

            if (mediaLibraryPermission.status === "granted") {
                setHasMediaLibraryPermission(true);
            } else {
                setHasMediaLibraryPermission(false);
            }

            if (locationPermission.status === "granted") {
                setLocationPermission(true);
                let currentLocation = await Location.getCurrentPositionAsync({})
                setLocation(currentLocation)
            } else {
                setLocationPermission(false);
            }
        };

        getPermissions();
    }, []);


    // Function for clearing database structure.
    const clearDatabase = () => {
        db.transaction(tx => {
            tx.executeSql('DROP TABLE IF EXISTS Images', [], () => {
                console.log('Table dropped successfully');
            }, (_, error) => {
                console.log('Error dropping table:', error);
            });

            // Recreate the Images table
            // createImagesTable();
        });
    };

    // Function to create the Images table
    const createImagesTable = () => {
        db.transaction(tx => {
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS Images (id INTEGER PRIMARY KEY AUTOINCREMENT, image_path TEXT, image_data TEXT, latitude REAL, longitude REAL)'
            );
        });
    };

    // Function to save image path to SQLite
    const saveImageToDB = async (imagePath, latitude, longitude) => {

        createImagesTable();
        db.transaction(tx => {
            tx.executeSql(
                'INSERT INTO Images (image_path, latitude, longitude) VALUES (?, ?, ?)',
                [imagePath, latitude, longitude],
                (_, results) => {
                    console.log('Image path saved to SQLite:', results.insertId);
                },
                (_, error) => {
                    console.log('Error saving image path:', error);
                }
            );
        });
    };

    if (hasCameraPermission === undefined) {
        return <Text>Requesting permissions...</Text>
    } else if (!hasCameraPermission) {
        return <Text>Permission for camera not granted. Please change this in settings.</Text>
    }

    let takePic = async () => {
        let options = {
            quality: 1,
            base64: false,
            exif: false
        }

        let newPhoto = await cameraRef.current.takePictureAsync(options)

        try {
            const ImagePath = newPhoto.uri;
            const latitude = location ? location.coords.latitude : null;
            const longitude = location ? location.coords.longitude : null;

            saveImageToDB(ImagePath, latitude, longitude); // Save image data as a binary blob to SQLite
            setPhoto(newPhoto);
        } catch (error) {
            console.error('Error saving image:', error);
        }
    }

    if (photo) {
        let sharePic = async () => {
            if (Platform.OS === 'ios') {
                // On iOS, use Sharing.shareAsync instead of Sharing.share
                await Sharing.shareAsync(photo.uri);
            } else {
                await Sharing.share(photo.uri);
            }
            setPhoto(null);
        };

        let savePhoto = async () => {
            if (hasMediaLibraryPermission) {
                await MediaLibrary.saveToLibraryAsync(photo.uri);
                setPhoto(null);
            }
        };

        return (
            <SafeAreaView style={styles.container}>
                <Image style={styles.preview} source={{ uri: photo.uri }} />
                <View style={{flexDirection:'row',justifyContent:'space-between',width:300}}>
                    <Icon name="ios-share-outline" size={30} color="#4F8EF7" onPress={sharePic}></Icon>
                    {hasMediaLibraryPermission ? <Icon name="ios-save" size={30} color="#4F8EF7" onPress={savePhoto}></Icon> : null}
                    {/* <Button title="Discard" onPress={() => setPhoto(null)} /> */}
                    <Icon name="ios-close-sharp" size={30} color="#4F8EF7" onPress={sharePic}></Icon>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <Camera style={styles.container} ref={cameraRef}>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={takePic}>
                    <Icon name="ios-camera" size={30} color="#4F8EF7" />
                </TouchableOpacity>
                {/* <Button  onPress={takePic}><Icon name="ios-albums" size={30} color="#4F8EF7" /></Button> */}
            </View>
            <StatusBar style="auto" />
        </Camera>
    )
}

export default CameraScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 600,
        marginVertical: 20,
        bottom: 10
    },

    preview: {
        width: 300,
        height: 300,
        marginBottom: 20,
    }
});