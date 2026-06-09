package com.agroorbit.api.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FazendaRequestDTO {

    @NotBlank(message = "Nome da fazenda é obrigatório")
    private String nome;

    @NotBlank(message = "Nome do proprietário é obrigatório")
    private String proprietario;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    private String telefone;

    @NotBlank(message = "Estado é obrigatório")
    private String estado;

    @NotBlank(message = "Município é obrigatório")
    private String municipio;

    @NotNull(message = "Área em hectares é obrigatória")
    @Positive(message = "Área deve ser positiva")
    private Double areaHectares;

    @NotBlank(message = "Cultura plantada é obrigatória")
    private String culturaPlantada;

    @NotNull(message = "Latitude é obrigatória")
    private Double latitude;

    @NotNull(message = "Longitude é obrigatória")
    private Double longitude;

    // Dados da leitura atual do satélite
    @NotNull(message = "Índice NDVI é obrigatório")
    @DecimalMin(value = "0.0") @DecimalMax(value = "1.0")
    private BigDecimal indiceNDVI;

    @NotNull(message = "Temperatura média é obrigatória")
    private BigDecimal temperaturaMedia;

    @NotNull(message = "Umidade do solo é obrigatória")
    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0")
    private BigDecimal umidadeSolo;

    @NotNull(message = "Irradiância solar é obrigatória")
    private BigDecimal irradianciaSolar;
}
