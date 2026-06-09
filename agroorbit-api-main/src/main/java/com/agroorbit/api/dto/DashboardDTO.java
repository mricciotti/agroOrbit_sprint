package com.agroorbit.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {

    private long totalFazendas;
    private long fazendasCriticas;
    private long fazendasEmAlerta;
    private long fazendasNormais;
    private Map<String, Long> distribuicaoRisco;
    private Map<String, Double> mediaNDVIPorEstado;
    private LocalDateTime geradoEm;
}
