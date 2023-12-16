import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Image, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/Ionicons';


const db = SQLite.openDatabase('imageGallery.db');


const AlbumScreen = () => {

    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageMetadata, setImageMetadata] = useState(null);
    const [images, setImages] = useState([]);

    const getPhotosAsync = async () => {
        try {
            const { status } = await MediaLibrary.getPermissionsAsync();
            if (status === 'granted') {
                const media = await MediaLibrary.getAssetsAsync({ mediaType: 'photo' });
                setPhotos(media.assets);
            } else {
                console.log('Permission not granted!');
            }
        } catch (error) {
            console.log('Error getting permission:', error);
        }
    };

    useEffect(() => {
        const askPermission = async () => {
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                setHasMediaLibraryPermission(status === 'granted');
            } catch (error) {
                console.log('Error asking for permission:', error);
                setHasMediaLibraryPermission(false);
            }
        };
        // askPermission();
        fetchImagesFromDB();
    }, [images]);

    // Function to fetch images from SQLite
    const fetchImagesFromDB = () => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM Images',
                [],
                (_, { rows }) => {
                    // Convert SQLResultSetRowList to an array of images
                    const fetchedImages = rows._array || [];
                    // console.log('Fetched images:', fetchedImages); // Log fetched images
                    setImages(fetchedImages);
                },
                (_, error) => {
                    console.log('Error fetching images:', error);
                }
            );
        });
    };

    // Function for deleting an image.
    const deleteSelectedImage = () => {
        if (selectedImage) {

            // Path to the image file
            const imagePath = selectedImage.image_path;

            // Delete image from SQLite database
            db.transaction(tx => {
                tx.executeSql(
                    'DELETE FROM Images WHERE id = ?',
                    [selectedImage.id],
                    (_, result) => {
                        console.log('Image deleted successfully');
                        fetchImagesFromDB(); // Refresh images after deletion
                        closeFullView(); // Close the modal after deletion
                    },
                    (_, error) => {
                        console.log('Error deleting image:', error);
                    }
                );
            });

            // Delete image file from device storage
            console.log('Image Path:', imagePath);
            FileSystem.deleteAsync(imagePath)
                .then(() => {
                    console.log('Image file deleted successfully');
                })
                .catch(error => {
                    console.log('Error deleting image file:', error);
                });
        }
    };

    const shareImage = async () => {
        if (selectedImage) {
            try {
                await Sharing.shareAsync(selectedImage.image_path);
            } catch (error) {
                console.error('Error sharing image:', error.message);
            }
        }
    };


    // Function for viewing the modal
    const openFullView = (item) => {
        setSelectedImage(item);
    };

    // Function for closing the modal
    const closeFullView = () => {
        setSelectedImage(null);
    };

    const renderImage = ({ item }) => (
        <TouchableOpacity onPress={() => openFullView(item)}>
            <Image style={styles.image} source={{ uri: item.image_path }} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {images.length === 0 ? (
                <>

                    <Text>No images found</Text>
                </>

            ) : (
                <FlatList
                    data={images}
                    renderItem={renderImage}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2} // Adjust this as needed
                />
            )}
            <Modal visible={selectedImage !== null} transparent={true}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={{top:50,left:160}} onPress={() => setImageMetadata(imageMetadata)}>
                        <Text style={{ marginHorizontal: 120 }}><Icon name="ios-information-circle" size={30} color="#4F8EF7" /></Text>
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            style={styles.fullImage}
                            source={{ uri: selectedImage.image_path }}
                            resizeMode="contain"
                        />
                    )}
                    {/* {imageMetadata && (
                        <View style={styles.metadataContainer}>
                            <Text style={styles.metadataText}>
                                Creation Date: {new Date(imageMetadata.creationTime).toLocaleString()}
                            </Text>
                            {imageMetadata.location && (
                                <Text style={styles.metadataText}>
                                    Location: {`${imageMetadata.location.latitude}, ${imageMetadata.location.longitude}`}
                                </Text>
                            )}
                        </View>
                    )} */}
                    <View style={styles.ModalButtons}>
                        <TouchableOpacity onPress={deleteSelectedImage}>
                            <Text style={styles.closeText}><Icon name="ios-trash-bin" size={30} color="#4F8EF7" /></Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{marginHorizontal:130}} onPress={shareImage}>
                            <Text style={styles.closeText}><Icon name="share" size={30} color="#4F8EF7" /></Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={closeFullView}>
                            <Text style={styles.closeText}><Icon name="ios-close-sharp" size={30} color="#4F8EF7" /></Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default AlbumScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 20,
    },
    image: {
        width: 150,
        height: 150,
        margin: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    fullImage: {
        width: '90%',
        height: '90%',
    },
    ModalButtons: {
        flexDirection: 'row',
        bottom: 40
    },
    closeText: {
        color: '#fff',
        fontSize: 16,
    },
});
