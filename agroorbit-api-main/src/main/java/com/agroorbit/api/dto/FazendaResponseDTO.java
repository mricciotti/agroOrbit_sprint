package com.agroorbit.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FazendaResponseDTO {
    private Long id;
    private String nome;
    private String proprietario;
    private String email;
    private String telefone;
    private String estado;
    private String municipio;
    private Double areaHectares;
    private String culturaPlantada;
    private Double latitude;
    private Double longitude;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
}