package com.cuonghoangdev.api_backend.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Unified interface for file storage operations.
 * Implementations handle specific storage backends (Cloudinary for images, Supabase for audio).
 */
public interface StorageService {

    /**
     * Upload a file to the storage backend.
     *
     * @param file     The multipart file to upload
     * @param folder   Optional folder/path within the storage bucket
     * @param fileName Optional custom filename (null = auto-generate)
     * @return StorageResult containing the public URL, public ID, and file metadata
     * @throws IOException if upload fails
     */
    StorageResult upload(MultipartFile file, String folder, String fileName) throws IOException;

    /**
     * Delete a file from storage.
     *
     * @param publicId The storage-specific public ID/path of the file
     * @return true if deleted, false if not found
     * @throws IOException if deletion fails
     */
    boolean delete(String publicId) throws IOException;

    /**
     * Check if this storage backend is properly configured.
     */
    boolean isConfigured();

    /**
     * Get the storage type identifier.
     */
    StorageType getType();

    enum StorageType {
        CLOUDINARY,
        SUPABASE
    }
}
