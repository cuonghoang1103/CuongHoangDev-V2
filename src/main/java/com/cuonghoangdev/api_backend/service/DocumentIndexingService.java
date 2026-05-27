package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.DocumentIndexRequest;
import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class DocumentIndexingService {

    private final EmbeddingService embeddingService;
    private final DocumentChunkRepository documentChunkRepository;

    public DocumentIndexingService(EmbeddingService embeddingService,
                                  DocumentChunkRepository documentChunkRepository) {
        this.embeddingService = embeddingService;
        this.documentChunkRepository = documentChunkRepository;
    }

    /**
     * Index một document - chia nhỏ thành chunks và tạo embeddings
     */
    @Transactional
    public List<DocumentChunk> indexDocument(DocumentIndexRequest request) {
        // Xóa chunks cũ nếu có
        documentChunkRepository.deleteByDocumentId(request.getDocumentId());

        // Chia document thành chunks
        List<String> chunks = splitIntoChunks(
                request.getContent(),
                request.getChunkSize(),
                request.getChunkOverlap()
        );

        // Tạo embeddings và lưu
        List<DocumentChunk> savedChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            String chunkContent = chunks.get(i);

            DocumentChunk chunk = new DocumentChunk();
            chunk.setContent(chunkContent);
            chunk.setDocumentId(request.getDocumentId());
            chunk.setDocumentType(request.getDocumentType());
            chunk.setChunkIndex(i);
            chunk.setMetadata(toJson(request.getMetadata()));

            // Tạo embedding
            float[] embedding = embeddingService.createEmbedding(chunkContent);
            chunk.setEmbedding(embeddingService.vectorToString(embedding));

            savedChunks.add(documentChunkRepository.save(chunk));
        }

        return savedChunks;
    }

    /**
     * Tái index một document - xóa và tạo lại
     */
    @Transactional
    public List<DocumentChunk> reindexDocument(DocumentIndexRequest request) {
        return indexDocument(request);
    }

    /**
     * Xóa document khỏi index
     */
    @Transactional
    public void deleteDocument(String documentId) {
        documentChunkRepository.deleteByDocumentId(documentId);
    }

    /**
     * Xóa tất cả documents theo document type
     */
    @Transactional
    public void deleteAllByDocumentType(String documentType) {
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentType(documentType);
        documentChunkRepository.deleteAll(chunks);
    }

    /**
     * Index tất cả posts đã publish
     */
    @Transactional
    public int reindexAllPosts(List<DocumentIndexRequest> posts) {
        int count = 0;
        for (DocumentIndexRequest post : posts) {
            indexDocument(post);
            count++;
        }
        return count;
    }

    /**
     * Chia text thành các chunks có overlap
     */
    public List<String> splitIntoChunks(String text, int chunkSize, int overlap) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> chunks = new ArrayList<>();

        // Tách theo câu (đơn giản)
        String[] sentences = text.split("(?<=[.!?])\\s+");
        StringBuilder currentChunk = new StringBuilder();
        int currentLength = 0;

        for (String sentence : sentences) {
            int sentenceLength = sentence.length();

            // Nếu câu dài hơn chunk size, xử lý đặc biệt
            if (sentenceLength > chunkSize) {
                // Lưu chunk hiện tại nếu có
                if (currentLength > 0) {
                    chunks.add(currentChunk.toString().trim());
                    currentChunk = new StringBuilder();
                    currentLength = 0;
                }
                // Chia câu dài thành nhiều chunks
                chunks.addAll(splitLongText(sentence, chunkSize));
                continue;
            }

            // Nếu thêm câu này sẽ vượt chunk size
            if (currentLength + sentenceLength > chunkSize && currentLength > 0) {
                chunks.add(currentChunk.toString().trim());

                // Bắt đầu chunk mới với overlap
                if (overlap > 0 && currentChunk.length() > overlap) {
                    String overlapText = currentChunk.substring(currentChunk.length() - overlap);
                    currentChunk = new StringBuilder(overlapText);
                    currentLength = overlapText.length();
                } else {
                    currentChunk = new StringBuilder();
                    currentLength = 0;
                }
            }

            currentChunk.append(sentence).append(" ");
            currentLength += sentenceLength + 1;
        }

        // Thêm chunk cuối cùng
        if (currentLength > 0) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    /**
     * Chia text dài thành các chunks nhỏ hơn
     */
    private List<String> splitLongText(String text, int chunkSize) {
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());
            chunks.add(text.substring(start, end));
            start = end;
        }
        return chunks;
    }

    /**
     * Chuyển Map thành JSON string
     */
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
