package com.agroorbit.api.controller;

import com.agroorbit.api.dto.*;
import com.agroorbit.api.service.MonitoramentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "AgroOrbit API", description = "Endpoints de monitoramento agrícola via satélite")
public class AgroOrbitController {

    private final MonitoramentoService monitoramentoService;

    @PostMapping("/analise")
    @Operation(summary = "Cadastrar fazenda e analisar dados de satélite")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Análise realizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "409", description = "Fazenda já cadastrada")
    })
    public ResponseEntity<AnaliseResponseDTO> analisar(@Valid @RequestBody FazendaRequestDTO request) {
        log.info("POST /analise — fazenda: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoramentoService.analisar(request));
    }

    @GetMapping("/fazendas/{email}")
    @Operation(summary = "Buscar fazenda por email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Fazenda encontrada"),
            @ApiResponse(responseCode = "404", description = "Fazenda não encontrada")
    })
    public ResponseEntity<FazendaResponseDTO> getFazenda(
            @Parameter(description = "Email da fazenda") @PathVariable String email) {
        log.info("GET /fazendas/{}", email);
        return ResponseEntity.ok(monitoramentoService.getFazendaPorEmail(email));
    }

    @PutMapping("/fazendas/{email}")
    @Operation(summary = "Atualizar dados de uma fazenda")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Fazenda atualizada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Fazenda não encontrada")
    })
    public ResponseEntity<FazendaResponseDTO> atualizarFazenda(
            @Parameter(description = "Email da fazenda") @PathVariable String email,
            @Valid @RequestBody AtualizarFazendaDTO request) {
        log.info("PUT /fazendas/{}", email);
        return ResponseEntity.ok(monitoramentoService.atualizarFazenda(email, request));
    }

    @DeleteMapping("/fazendas/{email}")
    @Operation(summary = "Remover fazenda por email")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Fazenda removida com sucesso"),
            @ApiResponse(responseCode = "404", description = "Fazenda não encontrada")
    })
    public ResponseEntity<Void> deletarFazenda(
            @Parameter(description = "Email da fazenda") @PathVariable String email) {
        log.info("DELETE /fazendas/{}", email);
        monitoramentoService.deletarFazenda(email);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/fazendas/id/{id}")
    @Operation(summary = "Remover fazenda por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Fazenda removida com sucesso"),
            @ApiResponse(responseCode = "404", description = "Fazenda não encontrada")
    })
    public ResponseEntity<Void> deletarFazendaPorId(
            @Parameter(description = "ID da fazenda") @PathVariable Long id) {
        log.info("DELETE /fazendas/id/{}", id);
        monitoramentoService.deletarFazendaPorId(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard geral de monitoramento")
    public ResponseEntity<DashboardDTO> getDashboard() {
        log.info("GET /dashboard");
        return ResponseEntity.ok(monitoramentoService.getDashboard());
    }

    @GetMapping("/alertas")
    @Operation(summary = "Listar fazendas em situação de risco")
    public ResponseEntity<List<AlertaDTO>> getAlertas(
            @Parameter(description = "Score mínimo (0-100)", example = "50")
            @RequestParam(defaultValue = "50") int scoreMinimo) {
        log.info("GET /alertas — scoreMinimo: {}", scoreMinimo);
        return ResponseEntity.ok(monitoramentoService.getAlertas(scoreMinimo));
    }
}