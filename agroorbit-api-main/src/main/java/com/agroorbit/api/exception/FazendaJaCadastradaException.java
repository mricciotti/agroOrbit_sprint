package com.agroorbit.api.exception;

public class FazendaJaCadastradaException extends RuntimeException {
    public FazendaJaCadastradaException(String email) {
        super("Fazenda já cadastrada com o email: " + email);
    }
}
