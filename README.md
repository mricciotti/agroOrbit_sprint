# AgroSat Mobile

Aplicativo mobile da Global Solution 2026.1 — projeto **AgroOrbit**.

## Ideia do projeto

O AgroOrbit é uma plataforma de monitoramento inteligente de fazendas. A proposta combina **satélite, drones, IoT e inteligência artificial** para identificar pragas, secas e anomalias na lavoura, gerar alertas automáticos e apoiar o fazendeiro na tomada de decisão pelo celular.

---

## Stack

| Tecnologia | Uso |
|---|---|
| React Native + Expo (~54) | Framework mobile |
| TypeScript | Tipagem em todo o projeto |
| Firebase Auth | Autenticação principal (login, cadastro, recuperação) |
| Open-Meteo API | Dados reais de clima por GPS |
| API Java/SOA AgroOrbit | Backend principal (JWT, CRUD fazendas, análise de risco) |
| AsyncStorage | Sessão JWT Java + índice local de fazendas criadas |
| Expo Location | GPS — recurso nativo obrigatório |
| react-native-maps | Mapa interativo (mobile/native) |
| react-native-svg | SVG do Brasil (browser/web) |

---

## Como rodar

```bash
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
  context/        AuthContext — Firebase + demo login + estado do usuário
  data/           Dados simulados locais (fazendas, talhões, alertas, relatórios)
  navigation/     AppNavigator (5 abas) + AuthNavigator + RootNavigator
  screens/        Telas do app
  services/       apiService, javaIntegrationService, mockService, weatherService
  theme/          Cores, espaçamentos e estilos globais
```

### Telas

| Tela | Descrição |
|---|---|
| `LoginScreen` | Login Firebase, cadastro e modo demo |
| `DashboardScreen` | Status geral, clima real via GPS, formulário de nova análise |
| `FazendasScreen` | Lista fazendas da API Java + mock, accordion com detalhes, remover |
| `AlertasScreen` | Alertas da API Java + mock em paralelo, filtro por status, modal de detalhes |
| `MapaScreen` | Mapa com react-native-maps (mobile) ou SVG do Brasil (browser) |
| `DroneScreen` | Missões de drone com status, duração, cobertura e análise de anomalias |

### Navegação

5 abas: **Início** · **Fazendas** · **Alertas** · **Mapa** · **Drone**

---

## Login e autenticação

O app tem três modos configuráveis em `src/config/environment.ts`.

### Modo demo (padrão)

Funciona sem Firebase e sem API Java. Use qualquer email com senha de pelo menos 4 caracteres, ou clique em **Entrar no Modo Demo**.

```
Email: produtor@agrosat.com
Senha: 123456
```

### Firebase Auth

1. Preencha as chaves em `src/config/firebase.ts`.
2. Em `environment.ts`, confirme:

```ts
USE_FIREBASE_AUTH: true
```

O app passa a usar `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` e recuperação de senha via Firebase.

### API Java/SOA

O app faz um **login técnico automático** na API Java para obter o JWT — o usuário não precisa saber disso. O login visual continua sendo feito pelo Firebase.

```ts
USE_JAVA_API_AUTH: true
USE_JAVA_API_DATA: true
```

Credenciais técnicas usadas internamente:

```
fazendeiro@agroorbit.com / agroorbit2026
```

---

## Integração com a API Java/SOA

### Fluxo

1. Usuário faz login pelo Firebase (ou modo demo).
2. App faz login técnico em `POST /api/v1/auth/login` e salva o JWT no AsyncStorage.
3. Todas as requisições usam `Authorization: Bearer {jwt}`.
4. Em caso de 401, o JWT é renovado automaticamente e a requisição é repetida.
5. Se a API estiver offline, o app cai automaticamente para dados mockados.

### Endpoints consumidos

| Método | Rota | Tela |
|---|---|---|
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

```
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

Fazendas de demonstração, talhões, missões de drone e relatórios são simulados localmente para garantir que o app funcione mesmo sem API.

---

## Manipulação de dados

O app atende ao requisito de manipulação de dados porque:

- Consome dados reais da Open-Meteo e da API Java/SOA.
- Exibe dados simulados de fazendas, talhões e missões de drone.
- Filtra alertas por status (Todos / Abertos / Em Andamento / Resolvidos).
- Altera status de alertas e persiste com AsyncStorage.
- Cria fazendas via `POST /analise` e as remove via `DELETE /fazendas/{email}`.
- Usa GPS (Expo Location) para localização e dados climáticos em tempo real.

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