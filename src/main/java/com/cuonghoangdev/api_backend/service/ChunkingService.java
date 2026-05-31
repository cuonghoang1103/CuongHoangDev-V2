package com.cuonghoangdev.api_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Chunks large documents into smaller, semantically-coherent pieces
 * for embedding and RAG retrieval.
 *
 * Strategy: Recursive character splitting with overlap.
 * Falls back to sentence splitting for natural paragraph boundaries.
 */
@Service
public class ChunkingService {

    private static final Logger log = LoggerFactory.getLogger(ChunkingService.class);

    // Default chunk settings (tuned for OpenAI text-embedding-3-small: 1536 dims)
    private static final int DEFAULT_CHUNK_SIZE = 800;      // characters
    private static final int DEFAULT_CHUNK_OVERLAP = 150;   // overlap between chunks

    public record Chunk(String content, int startIndex, int endIndex) {}

    /**
     * Split raw text into overlapping chunks.
     * Tries to respect sentence and paragraph boundaries for better coherence.
     *
     * @param text  The raw document text
     * @param maxChars  Target max characters per chunk (default 800)
     * @param overlap   Characters to overlap between adjacent chunks (default 150)
     * @return List of chunks with content and position metadata
     */
    public List<Chunk> chunk(String text, int maxChars, int overlap) {
        if (text == null || text.isBlank()) return List.of();

        List<Chunk> chunks = new ArrayList<>();
        String cleaned = text.replaceAll("\\r\\n", "\n").trim();

        int pos = 0;
        int chunkIndex = 0;
        while (pos < cleaned.length()) {
            int end = Math.min(pos + maxChars, cleaned.length());
            // If not at end of text, try to break at paragraph or sentence boundary
            if (end < cleaned.length()) {
                end = findBestBreakPoint(cleaned, pos, end);
            }

            String chunkText = cleaned.substring(pos, end).trim();
            if (!chunkText.isBlank()) {
                chunks.add(new Chunk(chunkText, pos, end));
                log.trace("Chunk {}: [{}..{}] {} chars", chunkIndex, pos, end, chunkText.length());
            }

            // Move forward, but include overlap so context isn't lost
            int advance = end - overlap;
            if (advance <= pos) advance = pos + Math.max(1, maxChars / 2);
            pos = advance;
            chunkIndex++;
        }

        log.info("Chunked '{}..' into {} pieces",
                cleaned.substring(0, Math.min(30, cleaned.length())),
                chunks.size());
        return chunks;
    }

    /**
     * Convenience method with default settings (800 chars, 150 overlap).
     */
    public List<Chunk> chunk(String text) {
        return chunk(text, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP);
    }

    /**
     * Find the best break point within [start..end].
     * Priority: blank line -> double newline -> single newline -> sentence end (.!?) -> comma -> natural cut.
     */
    private int findBestBreakPoint(String text, int start, int end) {
        // Look for paragraph break (blank line)
        for (int i = end - 1; i >= start + 50; i--) {
            if (text.charAt(i) == '\n' && i + 1 < text.length() && text.charAt(i + 1) == '\n') {
                return i + 2;
            }
        }

        // Look for sentence end followed by space
        for (int i = end - 1; i >= start + 50; i--) {
            char c = text.charAt(i);
            if (c == '.' || c == '!' || c == '?') {
                int next = i + 1;
                while (next < text.length() && text.charAt(next) == ' ') next++;
                if (next < text.length() && Character.isUpperCase(text.charAt(next))) {
                    return next;
                }
                // Vietnamese: "?" is common too
                return i + 1;
            }
        }

        // Look for newline (paragraph or line break)
        for (int i = end - 1; i >= start + 30; i--) {
            if (text.charAt(i) == '\n') {
                return i + 1;
            }
        }

        // Look for semicolon or comma
        for (int i = end - 1; i >= start + 30; i--) {
            char c = text.charAt(i);
            if (c == ';' || c == ',' || c == ':') {
                return i + 1;
            }
        }

        return end;
    }
}
