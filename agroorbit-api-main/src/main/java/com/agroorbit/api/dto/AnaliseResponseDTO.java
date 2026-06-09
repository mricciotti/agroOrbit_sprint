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
public class AnaliseResponseDTO {

    private Long leituraId;
    private Long fazendaId;
    private String nomeFazenda;
    private String proprietario;
    private String estado;
    private String municipio;
    private String culturaPlantada;

    private BigDecimal indiceNDVI;
    private BigDecimal temperaturaMedia;
    private BigDecimal umidadeSolo;
    private BigDecimal irradianciaSolar;

    private String nivelRisco;        // NORMAL, ALERTA, CRITICO
    private Integer scoreRisco;       // 0 a 100
    private String recomendacao;

    private LocalDateTime dataLeitura;
}
