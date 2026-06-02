package com.cuonghoangdev.api_backend.dto;

public class FileUploadResult {
    private final String url;
    private final String publicId;
    private final String originalName;
    private final String contentType;
    private final long fileSize;

    public FileUploadResult(String url, String publicId, String originalName, String contentType, long fileSize) {
        this.url = url;
        this.publicId = publicId;
        this.originalName = originalName;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }

    public String getUrl() { return url; }
    public String getPublicId() { return publicId; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public long getFileSize() { return fileSize; }
}
