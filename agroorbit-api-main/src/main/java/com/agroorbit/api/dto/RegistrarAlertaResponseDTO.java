package com.agroorbit.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarAlertaResponseDTO {

    private String nivelRisco;
    private int scoreRisco;
    private String recomendacao;
    private boolean sucesso;
    private String mensagem;
}