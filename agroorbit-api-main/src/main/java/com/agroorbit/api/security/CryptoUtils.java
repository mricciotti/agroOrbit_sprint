package com.agroorbit.api.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Slf4j
@Component
public class CryptoUtils {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKeySpec getKey() {
        // Usa os primeiros 16 bytes da chave JWT como chave AES
        byte[] keyBytes = secret.substring(0, 16).getBytes();
        return new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String data) {
        if (data == null) return null;
        try {
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.ENCRYPT_MODE, getKey());
            return Base64.getEncoder().encodeToString(cipher.doFinal(data.getBytes()));
        } catch (Exception e) {
            log.error("Erro ao criptografar dado sensível");
            throw new RuntimeException("Erro de criptografia");
        }
    }

    public String decrypt(String encrypted) {
        if (encrypted == null) return null;
        try {
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.DECRYPT_MODE, getKey());
            return new String(cipher.doFinal(Base64.getDecoder().decode(encrypted)));
        } catch (Exception e) {
            log.error("Erro ao descriptografar dado sensível");
            throw new RuntimeException("Erro de descriptografia");
        }
    }

    public String anonymize(String email) {
        if (email == null) return null;
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) return "***@" + email.substring(atIndex + 1);
        return email.charAt(0) + "***" + email.charAt(atIndex - 1) + email.substring(atIndex);
    }
}