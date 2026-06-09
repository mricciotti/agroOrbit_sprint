# AgroOrbit

Plataforma de monitoramento inteligente de fazendas via satélite — FIAP Global Solution 2026.

**Tema:** Space Connect — Tecnologia Espacial Aplicada a Desafios Reais

---

## Sobre o projeto

O AgroOrbit conecta o ecossistema espacial ao agronegócio brasileiro. A plataforma utiliza dados de satélite (NDVI, temperatura, umidade do solo e irradiância solar) para detectar riscos de seca e pragas antes que causem perda de colheita, classificando cada lavoura em três níveis: **NORMAL**, **ALERTA** ou **CRÍTICO**.

**Problema:** Fazendeiros perdem colheitas porque pragas e secas são detectadas tarde demais, sem visibilidade em tempo real da propriedade.

**Solução:** API REST + Web Service SOAP integrados a um app mobile que entrega análise de risco em tempo real, alertas automáticos e dados climáticos via GPS — diretamente no celular do produtor.

---

## Estrutura do repositório

```
agroOrbit_sprint/
├── agroorbit-api-main/   API REST + Web Service SOAP (Java / Spring Boot)
└── mobile/               Aplicativo mobile (React Native / Expo)
```

---

## Componentes

### API Java/SOA (`agroorbit-api-main/`)

API REST desenvolvida com Java 17 e Spring Boot 3.2. Implementa os princípios de SOA: baixo acoplamento, contratos de serviço, reutilização e separação de responsabilidades.

**Tecnologias:** Java 17, Spring Boot, Oracle Database, Flyway, JWT, Spring-WS (SOAP), Springdoc OpenAPI (Swagger), Bucket4j (rate limiting)

**Funcionalidades:**
- CRUD completo de fazendas via REST
- Análise de risco automática por leitura de satélite (NDVI, temperatura, umidade, irradiância)
- Web Service SOAP para consulta e registro de alertas
- Dashboard agregado com distribuição de risco por estado
- Autenticação JWT com roles (ADMIN, FAZENDEIRO, ANALISTA)
- Rate limiting e audit log por requisição

**Endpoints principais:**

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Autenticação JWT |
| `POST` | `/api/v1/analise` | Análise de risco da fazenda |
| `GET` | `/api/v1/dashboard` | Métricas agregadas |
| `GET` | `/api/v1/alertas` | Fazendas em alerta/crítico |
| `GET` | `/api/v1/fazendas/{email}` | Dados de uma fazenda |
| `DELETE` | `/api/v1/fazendas/{email}` | Remove uma fazenda |
| SOAP | `/ws` | Consulta e registro de alertas via WSDL |

**Como rodar:**

```bash
cd agroorbit-api-main

# Configure o banco em src/main/resources/application.properties:
# spring.datasource.url=jdbc:oracle:thin:@oracle.fiap.com.br:1521:ORCL
# spring.datasource.username=SEU_RM
# spring.datasource.password=SUA_SENHA

mvn spring-boot:run
```

Swagger disponível em: `http://localhost:8080/swagger-ui/index.html`
WSDL disponível em: `http://localhost:8080/ws/agroorbit.wsdl`

---

### App Mobile (`mobile/`)

Aplicativo React Native com Expo, integrado à API Java via JWT e à Open-Meteo API para dados climáticos reais por GPS.

**Tecnologias:** React Native, Expo, TypeScript, Firebase Auth, AsyncStorage, Expo Location, react-native-maps

**Telas:**
- **Início** — índice de saúde da operação, clima em tempo real, acesso rápido e alertas ativos
- **Fazendas** — listagem de fazendas da API + mock, detalhes por talhão, criação e remoção
- **Alertas** — central de alertas com filtro por status e modal de detalhes
- **Mapa** — mapa geoespacial com pins coloridos por nível de risco
- **Drone** — missões de varredura com análise de anomalias por IA

**Como rodar:**

```bash
cd mobile
npm install
npx expo start
```

Pressione `w` (browser), `a` (Android) ou `i` (iOS).

> Antes de rodar, configure `src/config/firebase.ts` com as credenciais do seu projeto Firebase e ajuste `JAVA_API_BASE_URL` em `src/config/environment.ts` conforme o ambiente (localhost, emulador ou celular físico).

---

## Integração entre serviços

O app mobile consome a API Java/SOA após o login Firebase:

1. Login visual via Firebase Auth (mobile).
2. Login técnico automático na API Java para obter o JWT.
3. Dados de fazendas, alertas e dashboard são buscados na API Java com `Authorization: Bearer {jwt}`.
4. Se a API estiver indisponível, o app usa dados mockados locais — a apresentação nunca trava.
5. A API Java internamente integra com o Web Service SOAP para registro e consulta de alertas.

---

## Arquitetura SOA

```
┌─────────────────────────────────┐
│         App Mobile              │
│  (React Native + Expo)          │
│  Firebase Auth | GPS | Maps     │
└────────────┬────────────────────┘
             │ REST / JWT
             ▼
┌─────────────────────────────────┐
│       API REST AgroOrbit        │
│  (Java 17 + Spring Boot)        │
│  /analise  /dashboard  /alertas │
└────────────┬────────────────────┘
             │ Interno
             ▼
┌─────────────────────────────────┐
│     Web Service SOAP            │
│  ConsultarFazenda               │
│  RegistrarAlerta                │
│  WSDL exposto em /ws            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│      Oracle Database            │
│  fazendas | leituras_satelite   │
└─────────────────────────────────┘
```

---

## ODS atendidos

| ODS | Contribuição |
|---|---|
| **ODS 2** — Fome Zero e Agricultura Sustentável | Detecção precoce de pragas e secas reduz perda de colheita |
| **ODS 9** — Indústria, Inovação e Infraestrutura | Integração de tecnologia espacial com IA no agronegócio |
| **ODS 13** — Ação Contra a Mudança Global do Clima | Monitoramento de NDVI e temperatura para adaptação climática |

---

## Integrantes

| Nome | RM |
|---|---|
| Fernanda Rocha Menon | RM 554673 |
| Luiza Macena Dantas | RM 556237 |
| Luan Ramos Garcia de Souza | RM 558537 |
| Matheus Ricciotti | RM 556930 |
| Matheus Bortolotto | RM 555189 |

---

*FIAP — Engenharia de Software — Global Solution 2026 — Space Connect*
