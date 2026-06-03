package com.cuonghoangdev.api_backend.service.storage;

/**
 * Result of a successful file upload operation.
 * Contains all metadata returned by the storage backend.
 */
public class StorageResult {

    /** Public URL to access the uploaded file */
    private final String url;

    /** Storage-specific identifier (Cloudinary public_id, Supabase path) */
    private final String publicId;

    /** Original filename */
    private final String originalFileName;

    /** MIME type of the uploaded file */
    private final String contentType;

    /** File size in bytes */
    private final long fileSize;

    /** Which storage backend handled this upload */
    private final StorageService.StorageType storageType;

    public StorageResult(
            String url,
            String publicId,
            String originalFileName,
            String contentType,
            long fileSize,
            StorageService.StorageType storageType
    ) {
        this.url = url;
        this.publicId = publicId;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.storageType = storageType;
    }

    public String getUrl() {
        return url;
    }

    public String getPublicId() {
        return publicId;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public StorageService.StorageType getStorageType() {
        return storageType;
    }

    @Override
    public String toString() {
        return "StorageResult{" +
                "url='" + url + '\'' +
                ", publicId='" + publicId + '\'' +
                ", originalFileName='" + originalFileName + '\'' +
                ", contentType='" + contentType + '\'' +
                ", fileSize=" + fileSize +
                ", storageType=" + storageType +
                '}';
    }
}
