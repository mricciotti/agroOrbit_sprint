-- V1__create_tables.sql
-- AgroOrbit - Criação das tabelas principais

CREATE TABLE fazendas (
    id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome             VARCHAR2(200)  NOT NULL,
    proprietario     VARCHAR2(200)  NOT NULL,
    email            VARCHAR2(200)  NOT NULL UNIQUE,
    telefone         VARCHAR2(20),
    estado           VARCHAR2(2)    NOT NULL,
    municipio        VARCHAR2(200)  NOT NULL,
    area_hectares    NUMBER(10,2)   NOT NULL,
    cultura_plantada VARCHAR2(100)  NOT NULL,
    latitude         NUMBER(10,6)   NOT NULL,
    longitude        NUMBER(10,6)   NOT NULL,
    criado_em        TIMESTAMP      NOT NULL,
    atualizado_em    TIMESTAMP      NOT NULL
);

CREATE TABLE leituras_satelite (
    id                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fazenda_id         NUMBER         NOT NULL REFERENCES fazendas(id),
    indice_ndvi        NUMBER(5,4)    NOT NULL,
    temperatura_media  NUMBER(5,2)    NOT NULL,
    umidade_solo       NUMBER(5,2)    NOT NULL,
    irradiancia_solar  NUMBER(8,2)    NOT NULL,
    nivel_risco        VARCHAR2(10)   NOT NULL,
    recomendacao       VARCHAR2(1000) NOT NULL,
    score_risco        NUMBER(3)      NOT NULL,
    data_leitura       TIMESTAMP      NOT NULL
);

CREATE INDEX idx_leituras_fazenda ON leituras_satelite(fazenda_id);
CREATE INDEX idx_leituras_score   ON leituras_satelite(score_risco DESC);
