package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EmbeddingService {

    private final DocumentChunkRepository documentChunkRepository;

    @Value("${app.ai.embedding.dimensions:1536}")
    private int embeddingDimensions;

    public EmbeddingService(DocumentChunkRepository documentChunkRepository) {
        this.documentChunkRepository = documentChunkRepository;
    }

    public float[] createEmbedding(String text) {
        return new float[embeddingDimensions];
    }

    public List<float[]> createEmbeddings(List<String> texts) {
        return texts.stream().map(t -> new float[embeddingDimensions]).toList();
    }

    @Transactional
    public DocumentChunk createAndSaveEmbedding(String content, Map<String, Object> metadata,
                                                String documentId, String documentType, int chunkIndex) {
        DocumentChunk chunk = new DocumentChunk();
        chunk.setContent(content);
        chunk.setMetadata(toJson(metadata));
        chunk.setDocumentId(documentId);
        chunk.setDocumentType(documentType);
        chunk.setChunkIndex(chunkIndex);
        chunk.setEmbedding(vectorToString(new float[embeddingDimensions]));
        return documentChunkRepository.save(chunk);
    }

    public String vectorToString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private String toJson(Map<String, Object> metadata) {
        if (metadata == null) return "{}";
        StringBuilder sb = new StringBuilder("{");
        var iterator = metadata.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            sb.append("\"").append(entry.getKey()).append("\":");
            if (entry.getValue() instanceof String) {
                sb.append("\"").append(entry.getValue()).append("\"");
            } else {
                sb.append(entry.getValue());
            }
            if (iterator.hasNext()) sb.append(",");
        }
        sb.append("}");
        return sb.toString();
    }
}
