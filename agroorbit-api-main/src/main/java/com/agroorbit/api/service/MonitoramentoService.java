package com.agroorbit.api.service;

import com.agroorbit.api.dao.FazendaDAO;
import com.agroorbit.api.dao.LeituraDAO;
import com.agroorbit.api.dto.*;
import com.agroorbit.api.exception.FazendaJaCadastradaException;
import com.agroorbit.api.exception.FazendaNaoEncontradaException;
import com.agroorbit.api.model.Fazenda;
import com.agroorbit.api.model.LeituraSatelite;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoramentoService {

    private final FazendaDAO fazendaDAO;
    private final LeituraDAO leituraDAO;

    public AnaliseResponseDTO analisar(FazendaRequestDTO request) {
        log.info("Iniciando análise para fazenda: {}", request.getEmail());

        if (fazendaDAO.existsByEmail(request.getEmail())) {
            throw new FazendaJaCadastradaException(request.getEmail());
        }

        Fazenda fazenda = fazendaDAO.save(Fazenda.builder()
                .nome(request.getNome())
                .proprietario(request.getProprietario())
                .email(request.getEmail())
                .telefone(request.getTelefone())
                .estado(request.getEstado())
                .municipio(request.getMunicipio())
                .areaHectares(request.getAreaHectares())
                .culturaPlantada(request.getCulturaPlantada())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build());

        String nivelRisco = calcularNivelRisco(request);
        int scoreRisco = calcularScoreRisco(nivelRisco, request);
        String recomendacao = gerarRecomendacao(nivelRisco, request);

        LeituraSatelite leitura = leituraDAO.save(LeituraSatelite.builder()
                .fazenda(fazenda)
                .indiceNDVI(request.getIndiceNDVI())
                .temperaturaMedia(request.getTemperaturaMedia())
                .umidadeSolo(request.getUmidadeSolo())
                .irradianciaSolar(request.getIrradianciaSolar())
                .nivelRisco(nivelRisco)
                .recomendacao(recomendacao)
                .scoreRisco(scoreRisco)
                .build());

        return AnaliseResponseDTO.builder()
                .leituraId(leitura.getId())
                .fazendaId(fazenda.getId())
                .nomeFazenda(fazenda.getNome())
                .proprietario(fazenda.getProprietario())
                .estado(fazenda.getEstado())
                .municipio(fazenda.getMunicipio())
                .culturaPlantada(fazenda.getCulturaPlantada())
                .indiceNDVI(leitura.getIndiceNDVI())
                .temperaturaMedia(leitura.getTemperaturaMedia())
                .umidadeSolo(leitura.getUmidadeSolo())
                .irradianciaSolar(leitura.getIrradianciaSolar())
                .nivelRisco(nivelRisco)
                .scoreRisco(scoreRisco)
                .recomendacao(recomendacao)
                .dataLeitura(leitura.getDataLeitura())
                .build();
    }

    public RegistrarAlertaResponseDTO registrarAlertaSoap(
            String emailFazenda,
            BigDecimal indiceNDVI,
            BigDecimal temperaturaMedia,
            BigDecimal umidadeSolo
    ) {
        log.info("Registrando alerta via SOAP para fazenda: {}", emailFazenda);

        Fazenda fazenda = fazendaDAO.findByEmail(emailFazenda)
                .orElseThrow(() -> new FazendaNaoEncontradaException(emailFazenda));

        FazendaRequestDTO request = FazendaRequestDTO.builder()
                .nome(fazenda.getNome())
                .proprietario(fazenda.getProprietario())
                .email(fazenda.getEmail())
                .telefone(fazenda.getTelefone())
                .estado(fazenda.getEstado())
                .municipio(fazenda.getMunicipio())
                .areaHectares(fazenda.getAreaHectares())
                .culturaPlantada(fazenda.getCulturaPlantada())
                .latitude(fazenda.getLatitude())
                .longitude(fazenda.getLongitude())
                .indiceNDVI(indiceNDVI)
                .temperaturaMedia(temperaturaMedia)
                .umidadeSolo(umidadeSolo)
                .irradianciaSolar(BigDecimal.ZERO)
                .build();

        String nivelRisco = calcularNivelRisco(request);
        int scoreRisco = calcularScoreRisco(nivelRisco, request);
        String recomendacao = gerarRecomendacao(nivelRisco, request);

        LeituraSatelite leitura = leituraDAO.save(LeituraSatelite.builder()
                .fazenda(fazenda)
                .indiceNDVI(indiceNDVI)
                .temperaturaMedia(temperaturaMedia)
                .umidadeSolo(umidadeSolo)
                .irradianciaSolar(BigDecimal.ZERO)
                .nivelRisco(nivelRisco)
                .scoreRisco(scoreRisco)
                .recomendacao(recomendacao)
                .build());

        log.info("Alerta SOAP registrado com sucesso. Leitura ID: {}", leitura.getId());

        return RegistrarAlertaResponseDTO.builder()
                .nivelRisco(nivelRisco)
                .scoreRisco(scoreRisco)
                .recomendacao(recomendacao)
                .sucesso(true)
                .mensagem("Alerta registrado e persistido via SOAP com sucesso.")
                .build();
    }

    public FazendaResponseDTO getFazendaPorEmail(String email) {
        Fazenda fazenda = fazendaDAO.findByEmail(email)
                .orElseThrow(() -> new FazendaNaoEncontradaException(email));

        return toFazendaResponse(fazenda);
    }

    public FazendaResponseDTO atualizarFazenda(String email, AtualizarFazendaDTO request) {
        Fazenda fazenda = fazendaDAO.findByEmail(email)
                .orElseThrow(() -> new FazendaNaoEncontradaException(email));

        if (request.getNome() != null) {
            fazenda.setNome(request.getNome());
        }

        if (request.getProprietario() != null) {
            fazenda.setProprietario(request.getProprietario());
        }

        if (request.getTelefone() != null) {
            fazenda.setTelefone(request.getTelefone());
        }

        if (request.getEstado() != null) {
            fazenda.setEstado(request.getEstado());
        }

        if (request.getMunicipio() != null) {
            fazenda.setMunicipio(request.getMunicipio());
        }

        if (request.getAreaHectares() != null) {
            fazenda.setAreaHectares(request.getAreaHectares());
        }

        if (request.getCulturaPlantada() != null) {
            fazenda.setCulturaPlantada(request.getCulturaPlantada());
        }

        if (request.getLatitude() != null) {
            fazenda.setLatitude(request.getLatitude());
        }

        if (request.getLongitude() != null) {
            fazenda.setLongitude(request.getLongitude());
        }

        Fazenda atualizada = fazendaDAO.update(fazenda);
        return toFazendaResponse(atualizada);
    }

    public void deletarFazenda(String email) {
        if (!fazendaDAO.existsByEmail(email)) {
            throw new FazendaNaoEncontradaException(email);
        }

        fazendaDAO.deleteByEmail(email);
    }

    public void deletarFazendaPorId(Long id) {
        if (!fazendaDAO.existsById(id)) {
            throw new FazendaNaoEncontradaException("id=" + id);
        }

        fazendaDAO.deleteById(id);
    }

    public DashboardDTO getDashboard() {
        long total = fazendaDAO.count();
        Map<String, Long> distribuicao = leituraDAO.countByNivelRisco();
        Map<String, Double> mediaNDVI = leituraDAO.mediaNDVIPorEstado();

        long criticas = distribuicao.getOrDefault("CRITICO", 0L);
        long alertas = distribuicao.getOrDefault("ALERTA", 0L);
        long normais = distribuicao.getOrDefault("NORMAL", 0L);

        return DashboardDTO.builder()
                .totalFazendas(total)
                .fazendasCriticas(criticas)
                .fazendasEmAlerta(alertas)
                .fazendasNormais(normais)
                .distribuicaoRisco(distribuicao)
                .mediaNDVIPorEstado(mediaNDVI)
                .geradoEm(LocalDateTime.now())
                .build();
    }

    public List<AlertaDTO> getAlertas(int scoreMinimo) {
        return leituraDAO.findAlertasAcimaDe(scoreMinimo)
                .stream()
                .map(l -> AlertaDTO.builder()
                        .fazendaId(l.getFazenda().getId())
                        .nomeFazenda(l.getFazenda().getNome())
                        .proprietario(l.getFazenda().getProprietario())
                        .email(l.getFazenda().getEmail())
                        .estado(l.getFazenda().getEstado())
                        .municipio(l.getFazenda().getMunicipio())
                        .culturaPlantada(l.getFazenda().getCulturaPlantada())
                        .indiceNDVI(l.getIndiceNDVI())
                        .nivelRisco(l.getNivelRisco())
                        .scoreRisco(l.getScoreRisco())
                        .recomendacao(l.getRecomendacao())
                        .dataLeitura(l.getDataLeitura())
                        .build())
                .collect(Collectors.toList());
    }

    private FazendaResponseDTO toFazendaResponse(Fazenda f) {
        return FazendaResponseDTO.builder()
                .id(f.getId())
                .nome(f.getNome())
                .proprietario(f.getProprietario())
                .email(f.getEmail())
                .telefone(f.getTelefone())
                .estado(f.getEstado())
                .municipio(f.getMunicipio())
                .areaHectares(f.getAreaHectares())
                .culturaPlantada(f.getCulturaPlantada())
                .latitude(f.getLatitude())
                .longitude(f.getLongitude())
                .criadoEm(f.getCriadoEm())
                .atualizadoEm(f.getAtualizadoEm())
                .build();
    }

    private String calcularNivelRisco(FazendaRequestDTO req) {
        double ndvi = req.getIndiceNDVI().doubleValue();
        double umidade = req.getUmidadeSolo().doubleValue();
        double temp = req.getTemperaturaMedia().doubleValue();

        if (ndvi < 0.2 || umidade < 15.0 || temp > 40.0) {
            return "CRITICO";
        }

        if (ndvi < 0.4 || umidade < 30.0 || temp > 35.0) {
            return "ALERTA";
        }

        return "NORMAL";
    }

    private int calcularScoreRisco(String nivelRisco, FazendaRequestDTO req) {
        double ndvi = req.getIndiceNDVI().doubleValue();
        double umidade = req.getUmidadeSolo().doubleValue();

        return switch (nivelRisco) {
            case "CRITICO" -> (int) (100 - (ndvi * 50) - (umidade * 0.3));
            case "ALERTA" -> (int) (70 - (ndvi * 40) - (umidade * 0.2));
            default -> (int) (30 - (ndvi * 20));
        };
    }

    private String gerarRecomendacao(String nivelRisco, FazendaRequestDTO req) {
        return switch (nivelRisco) {
            case "CRITICO" -> String.format(
                    "URGENTE: NDVI %.2f indica vegetação severamente estressada. " +
                            "Iniciar irrigação de emergência imediatamente. " +
                            "Acionar equipe técnica para avaliação presencial em até 24h.",
                    req.getIndiceNDVI()
            );

            case "ALERTA" -> String.format(
                    "ATENÇÃO: Umidade do solo em %.1f%% abaixo do ideal. " +
                            "Monitorar nos próximos 3 dias e acionar irrigação se não houver melhora. " +
                            "Verificar previsão de chuvas para a região.",
                    req.getUmidadeSolo()
            );

            default -> "Lavoura dentro dos parâmetros normais. " +
                    "Próxima leitura agendada automaticamente em 48h.";
        };
    }
}