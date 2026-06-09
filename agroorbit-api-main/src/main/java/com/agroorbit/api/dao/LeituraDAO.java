package com.agroorbit.api.dao;

import com.agroorbit.api.model.LeituraSatelite;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface LeituraDAO {

    LeituraSatelite save(LeituraSatelite leitura);

    Optional<LeituraSatelite> findUltimaLeituraByFazendaId(Long fazendaId);

    List<LeituraSatelite> findAlertasAcimaDe(int scoreMinimo);

    Map<String, Long> countByNivelRisco();

    Map<String, Double> mediaNDVIPorEstado();

    void deleteByFazendaId(Long fazendaId);
}