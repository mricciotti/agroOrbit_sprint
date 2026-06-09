# AgroOrbit Mobile

Aplicativo mobile da Global Solution 2026.1 — projeto **AgroOrbit**.

## Sobre o projeto

O AgroOrbit é uma plataforma de monitoramento inteligente de fazendas. A proposta combina **satélite, drones, IoT e inteligência artificial** para identificar pragas, secas e anomalias na lavoura, gerar alertas automáticos e apoiar o fazendeiro na tomada de decisão pelo celular.

O app se integra com a [API Java/SOA AgroOrbit](../agroorbit-api-main/Readme.md) para análise de risco em tempo real, e com a Open-Meteo API para dados climáticos via GPS. Quando a API está offline, o app cai automaticamente para dados mockados locais.

---

## Stack

| Tecnologia | Uso |
|---|---|
| React Native + Expo (~54) | Framework mobile |
| TypeScript | Tipagem em todo o projeto |
| Firebase Auth | Autenticação (login, cadastro, recuperação de senha) |
| Open-Meteo API | Dados reais de clima por GPS |
| API Java/SOA AgroOrbit | Backend principal (JWT, CRUD fazendas, análise de risco) |
| AsyncStorage | Sessão JWT Java + índice local de fazendas criadas |
| Expo Location | GPS — recurso nativo obrigatório |
| react-native-maps | Mapa interativo (mobile/native) |
| react-native-svg | SVG do Brasil (browser/web) |

---

## Como rodar

```bash
cd mobile
npm install
npx expo start
```

Pressione `w` para abrir no browser, `a` para Android, `i` para iOS.

---

## Estrutura

```
src/
  components/     Componentes reutilizáveis (Cards, StatusBadge, CustomButton)
  config/         Configuração de ambiente e Firebase
  context/        AuthContext — Firebase + estado do usuário
  data/           Dados simulados locais (fazendas, talhões, alertas)
  navigation/     AppNavigator (5 abas) + AuthNavigator + RootNavigator
  screens/        Telas do app
  services/       apiService, javaIntegrationService, mockService, weatherService
  theme/          Cores, espaçamentos e estilos globais
```

### Telas

| Tela | Descrição |
|---|---|
| `LoginScreen` | Login Firebase e cadastro |
| `DashboardScreen` | Status geral, clima real via GPS, formulário de nova análise |
| `FazendasScreen` | Lista fazendas da API Java + mock, accordion com detalhes, remover |
| `AlertasScreen` | Alertas da API Java + mock em paralelo, filtro por status, modal de detalhes |
| `MapaScreen` | Mapa com react-native-maps (mobile) ou SVG do Brasil (browser) |
| `DroneScreen` | Missões de drone com status, duração, cobertura e análise de anomalias |

### Navegação

5 abas: **Início** · **Fazendas** · **Alertas** · **Mapa** · **Drone**

---

## Login e autenticação

O app usa **Firebase Auth** como autenticação principal. Para configurar:

1. Preencha as chaves em `src/config/firebase.ts`.
2. Confirme em `src/config/environment.ts`:

```ts
USE_FIREBASE_AUTH: true
```

Cadastro, login e recuperação de senha são feitos via Firebase. Após o login, o app realiza automaticamente um **login técnico** na API Java para obter o JWT — o usuário não precisa saber disso.

---

## Integração com a API Java/SOA

### Fluxo

1. Usuário faz login pelo Firebase.
2. App faz login técnico em `POST /api/v1/auth/login` e salva o JWT no AsyncStorage.
3. Todas as requisições usam `Authorization: Bearer {jwt}`.
4. Em caso de 401, o JWT é renovado automaticamente e a requisição é repetida.
5. Se a API estiver offline, o app cai automaticamente para dados mockados.

### Endpoints consumidos

| Método | Rota | Tela |
| --- | --- | --- |
| `POST` | `/auth/login` | Automático (login técnico) |
| `POST` | `/analise` | Dashboard — nova análise |
| `GET` | `/dashboard` | Dashboard |
| `GET` | `/alertas?scoreMinimo=50` | Alertas |
| `GET` | `/fazendas/{email}` | Fazendas |
| `DELETE` | `/fazendas/{email}` | Fazendas |

### Índice local de fazendas

Quando o usuário cria uma fazenda via "Nova análise", o email gerado é salvo localmente com `registrarFazendaCriada()`. A tela de Fazendas usa `getFazendasCriadas()` para saber quais fazendas buscar na API. Ao remover uma fazenda, `removerFazendaCriada()` limpa o índice local e chama `DELETE /fazendas/{email}` na API.

### Configuração da URL

Edite `src/config/environment.ts`:

```ts
// Browser (web)
JAVA_API_BASE_URL: 'http://localhost:8080/api/v1'

// Android Emulator
JAVA_API_BASE_URL: 'http://10.0.2.2:8080/api/v1'

// Celular físico no Expo Go (use o IP da sua máquina)
JAVA_API_BASE_URL: 'http://192.168.0.10:8080/api/v1'
```

### Swagger da API

```text
http://localhost:8080/swagger-ui/index.html
```

---

## Dados reais e simulados

### Reais

- **Clima:** Open-Meteo API, consumida via GPS do dispositivo. Retorna temperatura, umidade, precipitação, cobertura de nuvens, probabilidade de chuva e risco de seca.
- **Fazendas:** `GET /fazendas/{email}` — fazendas criadas pelo usuário via "Nova análise".
- **Dashboard:** `GET /dashboard` — totais e distribuição de risco da API Java.
- **Alertas:** `GET /alertas` — fazendas em nível ALERTA ou CRÍTICO.

### Simulados (mock local)

Fazendas de demonstração, talhões, missões de drone e alertas são simulados localmente para garantir que o app funcione mesmo sem API.

---

## Recursos mobile utilizados

- **GPS / Expo Location** — captura coordenadas reais para clima e payload de análise.
- **react-native-maps** — mapa interativo no mobile com pins coloridos por status.
- **AsyncStorage** — persistência de sessão JWT, índice de fazendas criadas e status de alertas.

---

## Observações para a apresentação

- O app não depende obrigatoriamente da API Java. Fallback automático para mock garante que a apresentação não trave.
- No celular físico, `localhost` não funciona — use o IP da máquina onde a API está rodando.
- A tela de Mapa usa arquivos separados por plataforma: `MapaScreen.tsx` (mobile, com react-native-maps) e `MapaScreen.web.tsx` (browser, com SVG do Brasil).
- Os dados de missões de drone são simulados localmente — a API Java/SOA não expõe endpoint de drone por decisão arquitetural.

---

## ODS atendidos

- **ODS 2** — Fome zero e agricultura sustentável
- **ODS 9** — Indústria, inovação e infraestrutura
- **ODS 13** — Ação contra a mudança global do clima

---

## Integrantes

| Nome | RM |
| --- | --- |
| Fernanda Rocha Menon | RM 554673 |
| Luiza Macena Dantas | RM 556237 |
| Luan Ramos Garcia de Souza | RM 558537 |
| Matheus Ricciotti | RM 556930 |
| Matheus Bortolotto | RM 555189 |

FIAP — Engenharia de Software — Global Solution 2026 — Space Connect
