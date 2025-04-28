// components/PetPhotoUploader.jsx
import React, { useState, useEffect } from 'react';
import { PawPrint, Upload, Trash, Star } from 'lucide-react';
import axios from 'axios';

export default function PetPhotoUploader({ petId, petPhotos = [], onClose }) {
    const [photos, setPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // Load photos
        if (petPhotos && petPhotos.length > 0) {
            setPhotos(petPhotos);
        } else {
            fetchPhotos();
        }
    }, [petId, petPhotos]);

    const fetchPhotos = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`http://localhost:5000/api/pets/${petId}/photos`, {
                withCredentials: true
            });

            if (response.data.success) {
                setPhotos(response.data.photos);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load photos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/pets/${petId}/photos`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            setFile(null);
            // Reset the file input
            document.getElementById('photo-upload').value = '';

            // Add the new photo to the list
            if (response.data.success) {
                fetchPhotos(); // Refresh the list
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photo');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm('Are you sure you want to delete this photo?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:5000/api/pets/${petId}/photos/${photoId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Remove the photo from the list
                setPhotos(photos.filter(photo => photo.id !== photoId));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete photo');
        }
    };

    const handleSetPrimary = async (photoId) => {
        try {
            const response = await axios.put(
                `http://localhost:5000/api/pets/${petId}/photos/${photoId}/primary`,
                {},
                { withCredentials: true }
            );
            // components/PetPhotoUploader.jsx (continued)

            if (response.data.success) {
                // Update the photos list to reflect the new primary photo
                setPhotos(photos.map(photo => ({
                    ...photo,
                    is_primary: photo.id === photoId
                })));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to set primary photo');
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md">
                    {error}
                </div>
            )}

            {/* Upload Section */}
            <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Upload New Photo</h3>

                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        disabled={isUploading}
                    />

                    <button
                        type="button"
                        onClick={handleUpload}
                        className="bg-teal-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
                        disabled={!file || isUploading}
                    >
                        <Upload className="h-5 w-5 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                </div>

                {isUploading && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-teal-600 h-2.5 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <div className="text-sm text-center mt-1">{uploadProgress}%</div>
                    </div>
                )}
            </div>

            {/* Photos List */}
            <div>
                <h3 className="text-lg font-medium mb-4">Manage Photos</h3>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-700"></div>
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                        <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No photos uploaded yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className={`relative rounded-lg overflow-hidden border-2 ${photo.is_primary ? 'border-yellow-400' : 'border-gray-200'}`}
                            >
                                <div className="aspect-square bg-gray-100">
                                    <img
                                        src={`http://localhost:5000/api/pets/photos/${photo.id}`}
                                        alt={`Pet photo ${photo.id}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/api/placeholder/200/200';
                                        }}
                                    />
                                </div>

                                <div className="absolute top-0 right-0 p-2 flex gap-1">
                                    {!photo.is_primary && (
                                        <button
                                            onClick={() => handleSetPrimary(photo.id)}
                                            className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
                                            title="Set as primary photo"
                                        >
                                            <Star className="h-4 w-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeletePhoto(photo.id)}
                                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                                        title="Delete photo"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>

                                {photo.is_primary && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-xs text-center py-1">
                                        Primary Photo
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md"
                >
                    Done
                </button>
            </div>
        </div>
    );
}