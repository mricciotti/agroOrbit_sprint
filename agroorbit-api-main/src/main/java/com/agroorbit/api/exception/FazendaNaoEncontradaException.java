package com.agroorbit.api.exception;

public class FazendaNaoEncontradaException extends RuntimeException {
    public FazendaNaoEncontradaException(String email) {
        super("Fazenda não encontrada para o email: " + email);
    }
}