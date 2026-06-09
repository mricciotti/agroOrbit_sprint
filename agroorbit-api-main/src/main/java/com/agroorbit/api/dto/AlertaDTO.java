package com.agroorbit.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertaDTO {

    private Long fazendaId;
    private String nomeFazenda;
    private String proprietario;
    private String email;
    private String estado;
    private String municipio;
    private String culturaPlantada;
    private BigDecimal indiceNDVI;
    private String nivelRisco;
    private Integer scoreRisco;
    private String recomendacao;
    private LocalDateTime dataLeitura;
}
