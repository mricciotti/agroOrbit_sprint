package com.agroorbit.api.soap;

import com.agroorbit.api.dao.FazendaDAO;
import com.agroorbit.api.dto.RegistrarAlertaResponseDTO;
import com.agroorbit.api.model.Fazenda;
import com.agroorbit.api.service.MonitoramentoService;
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Endpoint
@RequiredArgsConstructor
public class FazendaEndpoint {

    private static final String NAMESPACE = "http://agroorbit.com/soap";

    private final FazendaDAO fazendaDAO;
    private final MonitoramentoService monitoramentoService;

    @PayloadRoot(namespace = NAMESPACE, localPart = "consultarFazendaRequest")
    @ResponsePayload
    public ConsultarFazendaResponse consultarFazenda(@RequestPayload ConsultarFazendaRequest request) {
        log.info("[SOAP] consultarFazenda — email: {}", request.getEmail());

        ConsultarFazendaResponse response = new ConsultarFazendaResponse();

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            response.setSucesso(false);
            response.setMensagem("Email não informado na requisição SOAP.");
            return response;
        }

        Optional<Fazenda> fazenda = fazendaDAO.findByEmail(request.getEmail());

        if (fazenda.isPresent()) {
            Fazenda f = fazenda.get();

            response.setId(f.getId());
            response.setNome(f.getNome());
            response.setProprietario(f.getProprietario());
            response.setEmail(f.getEmail());
            response.setEstado(f.getEstado());
            response.setMunicipio(f.getMunicipio());
            response.setCulturaPlantada(f.getCulturaPlantada());
            response.setAreaHectares(f.getAreaHectares());
            response.setSucesso(true);
            response.setMensagem("Fazenda encontrada com sucesso.");
        } else {
            response.setSucesso(false);
            response.setMensagem("Fazenda não encontrada para o email: " + request.getEmail());
        }

        return response;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "registrarAlertaRequest")
    @ResponsePayload
    public RegistrarAlertaResponse registrarAlerta(@RequestPayload RegistrarAlertaRequest request) {
        log.info("[SOAP] registrarAlerta — fazenda: {}", request.getEmailFazenda());

        RegistrarAlertaResponse response = new RegistrarAlertaResponse();

        if (request.getEmailFazenda() == null || request.getEmailFazenda().isBlank()) {
            response.setSucesso(false);
            response.setMensagem("Email da fazenda não informado na requisição SOAP.");
            return response;
        }

        try {
            RegistrarAlertaResponseDTO resultado = monitoramentoService.registrarAlertaSoap(
                    request.getEmailFazenda(),
                    BigDecimal.valueOf(request.getIndiceNDVI()),
                    BigDecimal.valueOf(request.getTemperaturaMedia()),
                    BigDecimal.valueOf(request.getUmidadeSolo())
            );

            response.setNivelRisco(resultado.getNivelRisco());
            response.setScoreRisco(resultado.getScoreRisco());
            response.setRecomendacao(resultado.getRecomendacao());
            response.setSucesso(resultado.isSucesso());
            response.setMensagem(resultado.getMensagem());

        } catch (Exception e) {
            log.error("[SOAP] Erro ao registrar alerta para fazenda: {}", request.getEmailFazenda(), e);

            response.setSucesso(false);
            response.setMensagem("Erro ao registrar alerta via SOAP: " + e.getMessage());
        }

        return response;
    }

    @XmlRootElement(namespace = NAMESPACE, name = "consultarFazendaRequest")
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ConsultarFazendaRequest {

        @XmlElement(namespace = NAMESPACE, required = true)
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    @XmlRootElement(namespace = NAMESPACE, name = "consultarFazendaResponse")
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ConsultarFazendaResponse {

        @XmlElement(namespace = NAMESPACE)
        private Long id;

        @XmlElement(namespace = NAMESPACE)
        private String nome;

        @XmlElement(namespace = NAMESPACE)
        private String proprietario;

        @XmlElement(namespace = NAMESPACE)
        private String email;

        @XmlElement(namespace = NAMESPACE)
        private String estado;

        @XmlElement(namespace = NAMESPACE)
        private String municipio;

        @XmlElement(namespace = NAMESPACE)
        private String culturaPlantada;

        @XmlElement(namespace = NAMESPACE)
        private Double areaHectares;

        @XmlElement(namespace = NAMESPACE)
        private String mensagem;

        @XmlElement(namespace = NAMESPACE)
        private boolean sucesso;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getNome() {
            return nome;
        }

        public void setNome(String nome) {
            this.nome = nome;
        }

        public String getProprietario() {
            return proprietario;
        }

        public void setProprietario(String proprietario) {
            this.proprietario = proprietario;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public String getMunicipio() {
            return municipio;
        }

        public void setMunicipio(String municipio) {
            this.municipio = municipio;
        }

        public String getCulturaPlantada() {
            return culturaPlantada;
        }

        public void setCulturaPlantada(String culturaPlantada) {
            this.culturaPlantada = culturaPlantada;
        }

        public Double getAreaHectares() {
            return areaHectares;
        }

        public void setAreaHectares(Double areaHectares) {
            this.areaHectares = areaHectares;
        }

        public String getMensagem() {
            return mensagem;
        }

        public void setMensagem(String mensagem) {
            this.mensagem = mensagem;
        }

        public boolean isSucesso() {
            return sucesso;
        }

        public void setSucesso(boolean sucesso) {
            this.sucesso = sucesso;
        }
    }

    @XmlRootElement(namespace = NAMESPACE, name = "registrarAlertaRequest")
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class RegistrarAlertaRequest {

        @XmlElement(namespace = NAMESPACE, required = true)
        private String emailFazenda;

        @XmlElement(namespace = NAMESPACE, required = true)
        private double indiceNDVI;

        @XmlElement(namespace = NAMESPACE, required = true)
        private double temperaturaMedia;

        @XmlElement(namespace = NAMESPACE, required = true)
        private double umidadeSolo;

        public String getEmailFazenda() {
            return emailFazenda;
        }

        public void setEmailFazenda(String emailFazenda) {
            this.emailFazenda = emailFazenda;
        }

        public double getIndiceNDVI() {
            return indiceNDVI;
        }

        public void setIndiceNDVI(double indiceNDVI) {
            this.indiceNDVI = indiceNDVI;
        }

        public double getTemperaturaMedia() {
            return temperaturaMedia;
        }

        public void setTemperaturaMedia(double temperaturaMedia) {
            this.temperaturaMedia = temperaturaMedia;
        }

        public double getUmidadeSolo() {
            return umidadeSolo;
        }

        public void setUmidadeSolo(double umidadeSolo) {
            this.umidadeSolo = umidadeSolo;
        }
    }

    @XmlRootElement(namespace = NAMESPACE, name = "registrarAlertaResponse")
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class RegistrarAlertaResponse {

        @XmlElement(namespace = NAMESPACE)
        private String nivelRisco;

        @XmlElement(namespace = NAMESPACE)
        private int scoreRisco;

        @XmlElement(namespace = NAMESPACE)
        private String recomendacao;

        @XmlElement(namespace = NAMESPACE)
        private boolean sucesso;

        @XmlElement(namespace = NAMESPACE)
        private String mensagem;

        public String getNivelRisco() {
            return nivelRisco;
        }

        public void setNivelRisco(String nivelRisco) {
            this.nivelRisco = nivelRisco;
        }

        public int getScoreRisco() {
            return scoreRisco;
        }

        public void setScoreRisco(int scoreRisco) {
            this.scoreRisco = scoreRisco;
        }

        public String getRecomendacao() {
            return recomendacao;
        }

        public void setRecomendacao(String recomendacao) {
            this.recomendacao = recomendacao;
        }

        public boolean isSucesso() {
            return sucesso;
        }

        public void setSucesso(boolean sucesso) {
            this.sucesso = sucesso;
        }

        public String getMensagem() {
            return mensagem;
        }

        public void setMensagem(String mensagem) {
            this.mensagem = mensagem;
        }
    }
}