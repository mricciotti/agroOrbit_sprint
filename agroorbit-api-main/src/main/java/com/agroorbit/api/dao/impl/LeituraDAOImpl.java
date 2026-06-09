package com.agroorbit.api.dao.impl;

import com.agroorbit.api.config.OracleConnectionFactory;
import com.agroorbit.api.dao.LeituraDAO;
import com.agroorbit.api.exception.DatabaseException;
import com.agroorbit.api.model.Fazenda;
import com.agroorbit.api.model.LeituraSatelite;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

@Repository
@RequiredArgsConstructor
public class LeituraDAOImpl implements LeituraDAO {

    private final OracleConnectionFactory connectionFactory;

    @Override
    public LeituraSatelite save(LeituraSatelite leitura) {
        String sql = """
            INSERT INTO leituras_satelite (
                fazenda_id, indice_ndvi, temperatura_media, umidade_solo,
                irradiancia_solar, nivel_risco, recomendacao, score_risco, data_leitura
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, new String[]{"id"})) {

            LocalDateTime agora = LocalDateTime.now();

            ps.setLong(1, leitura.getFazenda().getId());
            ps.setBigDecimal(2, leitura.getIndiceNDVI());
            ps.setBigDecimal(3, leitura.getTemperaturaMedia());
            ps.setBigDecimal(4, leitura.getUmidadeSolo());
            ps.setBigDecimal(5, leitura.getIrradianciaSolar());
            ps.setString(6, leitura.getNivelRisco());
            ps.setString(7, leitura.getRecomendacao());
            ps.setInt(8, leitura.getScoreRisco());
            ps.setTimestamp(9, Timestamp.valueOf(agora));

            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) leitura.setId(rs.getLong(1));
            }

            leitura.setDataLeitura(agora);
            return leitura;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar leitura de satélite", e);
        }
    }

    @Override
    public Optional<LeituraSatelite> findUltimaLeituraByFazendaId(Long fazendaId) {
        String sql = """
            SELECT l.id, l.fazenda_id, l.indice_ndvi, l.temperatura_media,
                   l.umidade_solo, l.irradiancia_solar, l.nivel_risco,
                   l.recomendacao, l.score_risco, l.data_leitura,
                   f.nome, f.proprietario, f.estado, f.municipio, f.cultura_plantada
            FROM leituras_satelite l
            JOIN fazendas f ON f.id = l.fazenda_id
            WHERE l.fazenda_id = ?
            ORDER BY l.data_leitura DESC
            FETCH FIRST 1 ROW ONLY
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, fazendaId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
                return Optional.empty();
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar última leitura", e);
        }
    }

    @Override
    public List<LeituraSatelite> findAlertasAcimaDe(int scoreMinimo) {
        String sql = """
            SELECT l.id, l.fazenda_id, l.indice_ndvi, l.temperatura_media,
                   l.umidade_solo, l.irradiancia_solar, l.nivel_risco,
                   l.recomendacao, l.score_risco, l.data_leitura,
                   f.nome, f.proprietario, f.estado, f.municipio, f.cultura_plantada
            FROM leituras_satelite l
            JOIN fazendas f ON f.id = l.fazenda_id
            WHERE l.score_risco >= ?
            ORDER BY l.score_risco DESC
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, scoreMinimo);
            try (ResultSet rs = ps.executeQuery()) {
                List<LeituraSatelite> lista = new ArrayList<>();
                while (rs.next()) lista.add(mapRow(rs));
                return lista;
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar alertas", e);
        }
    }

    @Override
    public Map<String, Long> countByNivelRisco() {
        String sql = "SELECT nivel_risco, COUNT(1) FROM leituras_satelite GROUP BY nivel_risco";

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            Map<String, Long> resultado = new LinkedHashMap<>();
            while (rs.next()) {
                resultado.put(rs.getString(1), rs.getLong(2));
            }
            return resultado;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao contar por nível de risco", e);
        }
    }

    @Override
    public Map<String, Double> mediaNDVIPorEstado() {
        String sql = """
            SELECT f.estado, AVG(l.indice_ndvi)
            FROM leituras_satelite l
            JOIN fazendas f ON f.id = l.fazenda_id
            GROUP BY f.estado
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            Map<String, Double> resultado = new LinkedHashMap<>();
            while (rs.next()) {
                resultado.put(rs.getString(1), Math.round(rs.getDouble(2) * 10000.0) / 10000.0);
            }
            return resultado;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao calcular média NDVI por estado", e);
        }
    }

    private LeituraSatelite mapRow(ResultSet rs) throws SQLException {
        Fazenda fazenda = Fazenda.builder()
                .id(rs.getLong("fazenda_id"))
                .nome(rs.getString("nome"))
                .proprietario(rs.getString("proprietario"))
                .estado(rs.getString("estado"))
                .municipio(rs.getString("municipio"))
                .culturaPlantada(rs.getString("cultura_plantada"))
                .build();

        return LeituraSatelite.builder()
                .id(rs.getLong("id"))
                .fazenda(fazenda)
                .indiceNDVI(rs.getBigDecimal("indice_ndvi"))
                .temperaturaMedia(rs.getBigDecimal("temperatura_media"))
                .umidadeSolo(rs.getBigDecimal("umidade_solo"))
                .irradianciaSolar(rs.getBigDecimal("irradiancia_solar"))
                .nivelRisco(rs.getString("nivel_risco"))
                .recomendacao(rs.getString("recomendacao"))
                .scoreRisco(rs.getInt("score_risco"))
                .dataLeitura(rs.getTimestamp("data_leitura").toLocalDateTime())
                .build();
    }

    @Override
    public void deleteByFazendaId(Long fazendaId) {
        String sql = "DELETE FROM leituras_satelite WHERE fazenda_id = ?";

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, fazendaId);
            ps.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao deletar leituras da fazenda", e);
        }
    }
}