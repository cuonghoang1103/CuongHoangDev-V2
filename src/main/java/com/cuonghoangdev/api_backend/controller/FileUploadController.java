package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.service.storage.SupabaseStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
public class FileUploadController {

    @Autowired
    private SupabaseStorageService supabaseStorage;

    /**
     * Generates a signed upload URL from Supabase Storage.
     * The browser uploads directly to Supabase using this URL — bypassing Vercel's
     * 4.5MB request body limit entirely.
     *
     * Flow:
     *   1. Browser calls this endpoint → gets signedUploadUrl
     *   2. Browser PUTs the file directly to Supabase (no Vercel in between)
     *   3. Supabase returns 200 OK with public URL
     */
    @GetMapping("/upload/signed-url")
    public ResponseEntity<?> getSignedUploadUrl(
            @RequestParam String filename,
            @RequestParam(defaultValue = "products") String folder,
            @RequestParam(defaultValue = "images") String contentType
    ) {
        try {
            String ext = getExtension(filename);
            String storagePath = folder + "/" + UUID.randomUUID() + ext;

            String signedUrl = supabaseStorage.createSignedUploadUrl(storagePath, 3600);

            String publicUrl = supabaseStorage.buildPublicUrl(storagePath);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "signedUrl", signedUrl,
                            "publicUrl", publicUrl,
                            "path", storagePath
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    private String getExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    }
}
