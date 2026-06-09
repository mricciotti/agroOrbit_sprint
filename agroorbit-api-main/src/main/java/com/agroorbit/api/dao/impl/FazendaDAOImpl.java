package com.agroorbit.api.dao.impl;

import com.agroorbit.api.config.OracleConnectionFactory;
import com.agroorbit.api.dao.FazendaDAO;
import com.agroorbit.api.exception.DatabaseException;
import com.agroorbit.api.model.Fazenda;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.Optional;
import com.agroorbit.api.dao.LeituraDAO;

@Repository
@RequiredArgsConstructor
public class FazendaDAOImpl implements FazendaDAO {

    private final OracleConnectionFactory connectionFactory;
    private final LeituraDAO leituraDAO;

    @Override
    public Fazenda save(Fazenda fazenda) {
        String sql = """
            INSERT INTO fazendas (
                nome, proprietario, email, telefone, estado, municipio,
                area_hectares, cultura_plantada, latitude, longitude,
                criado_em, atualizado_em
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, new String[]{"id"})) {

            LocalDateTime agora = LocalDateTime.now();
            ps.setString(1, fazenda.getNome());
            ps.setString(2, fazenda.getProprietario());
            ps.setString(3, fazenda.getEmail());
            ps.setString(4, fazenda.getTelefone());
            ps.setString(5, fazenda.getEstado());
            ps.setString(6, fazenda.getMunicipio());
            ps.setDouble(7, fazenda.getAreaHectares());
            ps.setString(8, fazenda.getCulturaPlantada());
            ps.setDouble(9, fazenda.getLatitude());
            ps.setDouble(10, fazenda.getLongitude());
            ps.setTimestamp(11, Timestamp.valueOf(agora));
            ps.setTimestamp(12, Timestamp.valueOf(agora));

            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) fazenda.setId(rs.getLong(1));
            }

            fazenda.setCriadoEm(agora);
            fazenda.setAtualizadoEm(agora);
            return fazenda;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar fazenda", e);
        }
    }

    @Override
    public Fazenda update(Fazenda fazenda) {
        String sql = """
            UPDATE fazendas SET
                nome = ?, proprietario = ?, telefone = ?, estado = ?,
                municipio = ?, area_hectares = ?, cultura_plantada = ?,
                latitude = ?, longitude = ?, atualizado_em = ?
            WHERE email = ?
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            LocalDateTime agora = LocalDateTime.now();
            ps.setString(1, fazenda.getNome());
            ps.setString(2, fazenda.getProprietario());
            ps.setString(3, fazenda.getTelefone());
            ps.setString(4, fazenda.getEstado());
            ps.setString(5, fazenda.getMunicipio());
            ps.setDouble(6, fazenda.getAreaHectares());
            ps.setString(7, fazenda.getCulturaPlantada());
            ps.setDouble(8, fazenda.getLatitude());
            ps.setDouble(9, fazenda.getLongitude());
            ps.setTimestamp(10, Timestamp.valueOf(agora));
            ps.setString(11, fazenda.getEmail());

            int rows = ps.executeUpdate();
            if (rows == 0) throw new DatabaseException("Fazenda não encontrada para update", null);

            fazenda.setAtualizadoEm(agora);
            return fazenda;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar fazenda", e);
        }
    }

    @Override
    public void deleteByEmail(String email) {
        String buscarFazendaSql = "SELECT id FROM fazendas WHERE email = ?";
        String deletarFazendaSql = "DELETE FROM fazendas WHERE email = ?";

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement psBuscar = conn.prepareStatement(buscarFazendaSql)) {

            psBuscar.setString(1, email);

            Long fazendaId = null;

            try (ResultSet rs = psBuscar.executeQuery()) {
                if (rs.next()) {
                    fazendaId = rs.getLong("id");
                }
            }

            if (fazendaId == null) {
                throw new DatabaseException("Fazenda não encontrada para exclusão", null);
            }

            leituraDAO.deleteByFazendaId(fazendaId);

            try (PreparedStatement psDelete = conn.prepareStatement(deletarFazendaSql)) {
                psDelete.setString(1, email);

                int rows = psDelete.executeUpdate();

                if (rows == 0) {
                    throw new DatabaseException("Fazenda não encontrada para exclusão", null);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao deletar fazenda", e);
        }
    }

    @Override
    public void deleteById(Long id) {
        String deletarFazendaSql = "DELETE FROM fazendas WHERE id = ?";

        try (Connection conn = connectionFactory.getConnection()) {
            leituraDAO.deleteByFazendaId(id);

            try (PreparedStatement ps = conn.prepareStatement(deletarFazendaSql)) {
                ps.setLong(1, id);
                int rows = ps.executeUpdate();
                if (rows == 0) {
                    throw new DatabaseException("Fazenda não encontrada para exclusão", null);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao deletar fazenda por id", e);
        }
    }

    @Override
    public boolean existsById(Long id) {
        String sql = "SELECT COUNT(1) FROM fazendas WHERE id = ?";

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao verificar id da fazenda", e);
        }
    }

    @Override
    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(1) FROM fazendas WHERE email = ?";

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao verificar email da fazenda", e);
        }
    }

    @Override
    public Optional<Fazenda> findByEmail(String email) {
        String sql = """
            SELECT id, nome, proprietario, email, telefone, estado, municipio,
                   area_hectares, cultura_plantada, latitude, longitude,
                   criado_em, atualizado_em
            FROM fazendas WHERE email = ?
            """;

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
                return Optional.empty();
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar fazenda por email", e);
        }
    }

    @Override
    public long count() {
        String sql = "SELECT COUNT(1) FROM fazendas";

        try (Connection conn = connectionFactory.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            return rs.next() ? rs.getLong(1) : 0L;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao contar fazendas", e);
        }
    }

    private Fazenda mapRow(ResultSet rs) throws SQLException {
        return Fazenda.builder()
                .id(rs.getLong("id"))
                .nome(rs.getString("nome"))
                .proprietario(rs.getString("proprietario"))
                .email(rs.getString("email"))
                .telefone(rs.getString("telefone"))
                .estado(rs.getString("estado"))
                .municipio(rs.getString("municipio"))
                .areaHectares(rs.getDouble("area_hectares"))
                .culturaPlantada(rs.getString("cultura_plantada"))
                .latitude(rs.getDouble("latitude"))
                .longitude(rs.getDouble("longitude"))
                .criadoEm(rs.getTimestamp("criado_em").toLocalDateTime())
                .atualizadoEm(rs.getTimestamp("atualizado_em").toLocalDateTime())
                .build();
    }
}