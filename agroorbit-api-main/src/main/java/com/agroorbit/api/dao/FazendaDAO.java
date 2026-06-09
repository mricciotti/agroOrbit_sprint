package com.agroorbit.api.dao;

import com.agroorbit.api.model.Fazenda;

import java.util.Optional;

public interface FazendaDAO {
    Fazenda save(Fazenda fazenda);
    boolean existsByEmail(String email);
    Optional<Fazenda> findByEmail(String email);
    Fazenda update(Fazenda fazenda);
    void deleteByEmail(String email);
    void deleteById(Long id);
    boolean existsById(Long id);
    long count();
}