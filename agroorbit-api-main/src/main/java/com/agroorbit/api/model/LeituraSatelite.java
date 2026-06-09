package com.agroorbit.api.model;

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
public class LeituraSatelite {

    private Long id;
    private Fazenda fazenda;
    private BigDecimal indiceNDVI;        // 0.0 a 1.0 — saúde da vegetação
    private BigDecimal temperaturaMedia;  // graus Celsius
    private BigDecimal umidadeSolo;       // porcentagem
    private BigDecimal irradianciaSolar;  // W/m²
    private String nivelRisco;            // NORMAL, ALERTA, CRITICO
    private String recomendacao;
    private Integer scoreRisco;           // 0 a 100
    private LocalDateTime dataLeitura;
}
