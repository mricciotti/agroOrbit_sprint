package com.agroorbit.api.dto;

import lombok.Data;

@Data
public class AtualizarFazendaDTO {
    private String nome;
    private String proprietario;
    private String telefone;
    private String estado;
    private String municipio;
    private Double areaHectares;
    private String culturaPlantada;
    private Double latitude;
    private Double longitude;
}