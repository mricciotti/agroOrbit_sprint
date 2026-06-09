# 🛰️ AgroOrbit API

> Plataforma de Monitoramento Agrícola via Satélite — FIAP Global Solution 2026

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)
![Oracle](https://img.shields.io/badge/Oracle-19.3-red)
![JWT](https://img.shields.io/badge/Auth-JWT-blue)

---

## 📋 Sobre o Projeto

O **AgroOrbit** é uma API REST desenvolvida para a Global Solution 2026 da FIAP, tema **Space Connect**. A plataforma utiliza dados de satélite para monitorar lavouras brasileiras e detectar riscos de seca e pragas antes que causem perdas na colheita.

**Problema:** Fazendeiros brasileiros perdem colheitas porque pragas e secas são detectadas tarde demais, sem visibilidade em tempo real da propriedade.

**Solução:** A API recebe dados de satélite (NDVI, temperatura, umidade e irradiância solar), analisa automaticamente o risco da lavoura e retorna recomendações de ação classificadas em três níveis: **NORMAL**, **ALERTA** e **CRÍTICO**.

---

## 🎯 Conexão com os ODS da ONU

| ODS | Contribuição |
|-----|-------------|
| **ODS 2** — Fome Zero | Detecta pragas e secas antes que causem perda de colheita |
| **ODS 9** — Inovação | Integra tecnologia espacial com IA para modernizar o agronegócio |
| **ODS 13** — Clima | Monitora índices de vegetação e temperatura para adaptação climática |

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Java | 17 | Linguagem principal |
| Spring Boot | 3.2.0 | Framework da API REST |
| Oracle Database | 19.3 | Banco de dados (FIAP) |
| Flyway | 9.22.3 | Migração do banco |
| JWT (jjwt) | 0.12.3 | Autenticação |
| Springdoc OpenAPI | 2.3.0 | Documentação Swagger |
| Lombok | 1.18.38 | Redução de boilerplate |
| Bucket4j | 8.7.0 | Rate limiting |

---

## 📁 Estrutura do Projeto

```
src/main/java/com/agroorbit/api/
├── config/
│   ├── DataSourceConfig.java
│   ├── OracleConnectionFactory.java
│   └── SwaggerConfig.java
├── controller/
│   ├── AgroOrbitController.java
│   └── AuthController.java
├── dao/
│   ├── FazendaDAO.java
│   ├── LeituraDAO.java
│   └── impl/
│       ├── FazendaDAOImpl.java
│       └── LeituraDAOImpl.java
├── dto/
│   ├── AlertaDTO.java
│   ├── AnaliseResponseDTO.java
│   ├── DashboardDTO.java
│   ├── FazendaRequestDTO.java
│   ├── LoginRequestDTO.java
│   └── LoginResponseDTO.java
├── exception/
│   ├── DatabaseException.java
│   ├── ErrorResponse.java
│   ├── FazendaJaCadastradaException.java
│   └── GlobalExceptionHandler.java
├── model/
│   ├── Fazenda.java
│   └── LeituraSatelite.java
├── security/
│   ├── AuditLogFilter.java
│   ├── CryptoUtils.java
│   ├── JwtAuthFilter.java
│   ├── JwtService.java
│   ├── RateLimitFilter.java
│   └── SecurityConfig.java
├── service/
│   └── MonitoramentoService.java
└── AgroOrbitApplication.java

src/main/resources/
├── application.properties
└── db/migration/
    └── V1__create_tables.sql
```

---

## ⚙️ Configuração

### Pré-requisitos
- Java 17+
- Maven 3.9+
- Acesso ao Oracle Database da FIAP

### application.properties

```properties
spring.datasource.url=jdbc:oracle:thin:@oracle.fiap.com.br:1521:ORCL
spring.datasource.username=SEU_RM
spring.datasource.password=SUA_SENHA
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
```

### Criar tabelas no banco Oracle

Execute o script SQL disponível em `src/main/resources/db/migration/V1__create_tables.sql`:

```sql
CREATE TABLE fazendas (
    id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome             VARCHAR2(200)  NOT NULL,
    proprietario     VARCHAR2(200)  NOT NULL,
    email            VARCHAR2(200)  NOT NULL UNIQUE,
    ...
);

CREATE TABLE leituras_satelite (
    id                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fazenda_id         NUMBER NOT NULL REFERENCES fazendas(id),
    indice_ndvi        NUMBER(5,4) NOT NULL,
    nivel_risco        VARCHAR2(10) NOT NULL,
    ...
);
```

---

## ▶️ Como Rodar

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/agroorbit-api.git
cd agroorbit-api

# Rodar
mvn spring-boot:run
```

Acesse o Swagger em: **http://localhost:8080/swagger-ui/index.html**

---

## 🔐 Autenticação

A API utiliza **JWT Bearer Token**. Para autenticar:

**POST** `/api/v1/auth/login`

```json
{
  "email": "admin@agroorbit.com",
  "senha": "agroorbit2026"
}
```

Usuários disponíveis:

| Email | Senha | Role |
|-------|-------|------|
| admin@agroorbit.com | agroorbit2026 | ADMIN |
| fazendeiro@agroorbit.com | agroorbit2026 | FAZENDEIRO |
| analista@agroorbit.com | agroorbit2026 | ANALISTA |

---

## 📡 Endpoints

### POST `/api/v1/analise`
Recebe dados da fazenda e leituras do satélite, retorna análise de risco.

**Request:**
```json
{
  "nome": "Fazenda São João",
  "proprietario": "João Silva",
  "email": "joao@fazenda.com",
  "estado": "SP",
  "municipio": "Ribeirão Preto",
  "areaHectares": 150.5,
  "culturaPlantada": "Soja",
  "latitude": -21.1767,
  "longitude": -47.8208,
  "indiceNDVI": 0.18,
  "temperaturaMedia": 38.5,
  "umidadeSolo": 12.0,
  "irradianciaSolar": 850.0
}
```

**Response (201):**
```json
{
  "fazendaId": 1,
  "nomeFazenda": "Fazenda São João",
  "nivelRisco": "CRITICO",
  "scoreRisco": 87,
  "recomendacao": "URGENTE: NDVI 0.18 indica vegetação severamente estressada..."
}
```

### GET `/api/v1/dashboard`
Retorna métricas agregadas de todas as fazendas monitoradas.

### GET `/api/v1/alertas?scoreMinimo=50`
Lista fazendas com score de risco acima do mínimo, ordenadas por prioridade.

---

## 🌱 Lógica de Análise de Risco

| Nível | Condição | Score |
|-------|----------|-------|
| **CRÍTICO** | NDVI < 0.2 OU Umidade < 15% OU Temp > 40°C | 70-100 |
| **ALERTA** | NDVI < 0.4 OU Umidade < 30% OU Temp > 35°C | 30-69 |
| **NORMAL** | Todos os parâmetros dentro do ideal | 0-29 |

---

## 👥 Integrantes

| Nome | RM |
|---|---|
| Fernanda Rocha Menon | RM 554673 |
| Luiza Macena Dantas | RM 556237 |
| Luan Ramos Garcia de Souza | RM 558537 |
| Matheus Ricciotti | RM 556930 |
| Matheus Bortolotto | RM 555189 |
---

*FIAP — Engenharia de Software — Global Solution 2026 — Space Connect*
