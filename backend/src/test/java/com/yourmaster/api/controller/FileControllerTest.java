package com.yourmaster.api.controller;

import com.yourmaster.api.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class FileControllerTest {

    @Mock
    private FileService fileService;

    @InjectMocks
    private FileController fileController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testUploadFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "test".getBytes());

        when(fileService.uploadFile(any(String.class), any())).thenReturn("test.txt");

        ResponseEntity<String> response = fileController.uploadFileHandler(file);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("File was uploaded: test.txt", response.getBody());
    }
}
