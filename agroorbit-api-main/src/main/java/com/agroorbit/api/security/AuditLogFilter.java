package com.agroorbit.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.time.LocalDateTime;

@Slf4j
@Component
public class AuditLogFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        ContentCachingResponseWrapper wrappedResponse =
                new ContentCachingResponseWrapper(response);

        long inicio = System.currentTimeMillis();

        try {
            chain.doFilter(request, wrappedResponse);
        } finally {
            long duracao = System.currentTimeMillis() - inicio;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            // Nunca loga dados sensíveis — apenas método, path, status e usuário
            String usuario = (auth != null && auth.isAuthenticated())
                    ? auth.getName()
                    : "anonimo";

            log.info("[AUDIT] {} | {} {} | status={} | {}ms | ip={}",
                    LocalDateTime.now(),
                    request.getMethod(),
                    request.getRequestURI(),
                    wrappedResponse.getStatus(),
                    duracao,
                    request.getRemoteAddr()
            );

            // Alerta para eventos suspeitos
            if (wrappedResponse.getStatus() == 401 || wrappedResponse.getStatus() == 403) {
                log.warn("[SECURITY] Acesso negado | usuario={} | {} {} | ip={}",
                        usuario,
                        request.getMethod(),
                        request.getRequestURI(),
                        request.getRemoteAddr()
                );
            }

            wrappedResponse.copyBodyToResponse();
        }
    }
}