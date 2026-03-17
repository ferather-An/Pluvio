# Arquitetura Pluvio Web 3.x

Plataforma web para cálculo de curvas IDF, mantendo compatibilidade com o Plúvio 2.1 (modo legado) e suportando métodos modernos (GEV, desagregação, interpolação espacial).

---

## 1. Estrutura de Pastas

### 1.1 Frontend (React/Next ou Vite)

```text
frontend/
  node_modules/
  public/
  src/
    assets/
    components/
      layout/
      ui/
      map/
      forms/
      reports/
    data/
    hooks/
    pages/
      Admin/
      Auth/
      Home/
      IDF/
      User/
    redux/
    utils/
    App.jsx
    main.jsx
    index.css
  package.json
  vite.config.js
  vercel.json
  .eslintrc.cjs
  .gitignore
```

### 1.2 Backend (Node + Nest/Fastify ou Express)

```text
server/
  configs/
  controllers/
    idf.controller.js
    admin.controller.js
    auth.controller.js
  helpers/
  middlewares/
    auth.middleware.js
    ratelimit.middleware.js
  models/
    idf_equation.model.js
    dataset.model.js
    estacao.model.js
    municipio.model.js
    reference.model.js
    update_log.model.js
  routes/
    v1.routes.js
    admin.routes.js
  services/
    idf.service.js
    dataset.service.js
    interpolation.service.js
    legacy_calculator.py
    modern_calculator.py
  validators/
    idf.validator.js
  tests/
  .env
  package.json
  server.js
  vercel.json
  .gitignore
```

---

## 2. Diagrama de Casos de Uso (Mermaid)

```mermaid
flowchart TD
  subgraph Atores
    U["👤 Usuário"]
    A["🔧 Administrador"]
    S["🔌 Sistema Externo"]
  end

  subgraph Casos_de_Uso_Usuario["Casos de Uso - Usuário"]
    UC01["UC01 - Selecionar UF/Município/Estação"]
    UC02["UC02 - Informar duração e TR"]
    UC03["UC03 - Solicitar cálculo IDF"]
    UC04["UC04 - Visualizar parâmetros e curva"]
    UC05["UC05 - Gerar relatório técnico PDF/JSON"]
  end

  subgraph Casos_de_Uso_Admin["Casos de Uso - Administrador"]
    UC10["UC10 - Fazer login administrativo"]
    UC11["UC11 - Importar planilha XLSX"]
    UC12["UC12 - Cadastrar relatório PDF"]
    UC13["UC13 - Validar e publicar versão"]
    UC14["UC14 - Consultar histórico e auditoria"]
  end

  subgraph Casos_de_Uso_Externo["Casos de Uso - Sistema Externo"]
    UC20["UC20 - Listar UFs, municípios e estações"]
    UC21["UC21 - Chamar /idf/calculate"]
    UC22["UC22 - Consultar equações e referências"]
  end

  U --> UC01
  U --> UC02
  U --> UC03
  U --> UC04
  U --> UC05

  A --> UC10
  A --> UC11
  A --> UC12
  A --> UC13
  A --> UC14

  S --> UC20
  S --> UC21
  S --> UC22
```

---

## 3. Modelo ER (Mermaid)

```mermaid
erDiagram
  UF {
    int id_uf PK
    string sigla
    string nome
  }

  MUNICIPIO {
    int id_municipio PK
    int id_uf FK
    string nome
    string cod_ibge
  }

  ESTACAO {
    int id_estacao PK
    int id_municipio FK
    string codigo_oficial
    string nome
    float latitude
    float longitude
    geometry geom
  }

  DATASET {
    int id_dataset PK
    string descricao
    string origem
    date periodo_inicio
    date periodo_fim
    string status
    datetime data_importacao
  }

  REFERENCE {
    string code PK
    string titulo
    string autores
    int ano
    string tipo
    string link
    string arquivo_pdf
  }

  IDFEQUATION {
    int id_equation PK
    int id_estacao FK
    int id_municipio FK
    int id_uf FK
    int id_dataset FK
    string reference_code FK
    string modelo
    string modo
    float K
    float a
    float b
    float c
    int duracao_min
    int duracao_max
    int TR_min
    int TR_max
    float qualidade_ajuste
    string versao
    bool ativo
  }

  INTERPOLATIONRULE {
    int id_regra PK
    string escopo
    string metodo
    string parametros_json
    bool ativo
  }

  UPDATELOG {
    int id_update PK
    int id_dataset FK
    string usuario
    datetime data
    string tipo
    string descricao
  }

  UF ||--o{ MUNICIPIO : "possui"
  MUNICIPIO ||--o{ ESTACAO : "possui"
  DATASET ||--o{ IDFEQUATION : "gera"
  REFERENCE ||--o{ IDFEQUATION : "referencia"
  DATASET ||--o{ UPDATELOG : "registra"
  UF ||--o{ IDFEQUATION : "equacao-uf"
  MUNICIPIO ||--o{ IDFEQUATION : "equacao-municipio"
  ESTACAO ||--o{ IDFEQUATION : "equacao-estacao"
```

---

## 4. Diagrama de Classes / Componentes UML (Mermaid)

```mermaid
classDiagram
  class IDFService {
    +IDFResult calculate(IDFRequest request)
    +IDFEquationDTO getEquation(int id)
    +UF[] listUFs()
    +Municipio[] listMunicipios(string uf)
    +Estacao[] listEstacoes(Filtros filtros)
  }

  class LegacyIDFCalculator {
    +float calculate(float K, float a, float b, float c, int duracao, int TR)
  }

  class ModernIDFCalculator {
    +ParamGEV fitGEV(Serie serie)
    +float calculateGEV(ParamGEV params, int duracao, int TR)
    +Serie desagregarChuvaDiaria(SerieDiaria serie)
  }

  class InterpolationService {
    +IDFEquation interpolarPorIDW(Ponto ponto, Estacao[] estacoes)
    +IDFEquation interpolarPorKriging(Ponto ponto, Estacao[] estacoes)
  }

  class DatasetService {
    +Dataset importXLSX(Arquivo arquivo)
    +Reference importPDF(Arquivo arquivo)
    +void publicarDataset(int id_dataset)
  }

  class RepositoryUF
  class RepositoryMunicipio
  class RepositoryEstacao
  class RepositoryIDFEquation
  class RepositoryDataset
  class RepositoryReference

  IDFService --> LegacyIDFCalculator
  IDFService --> ModernIDFCalculator
  IDFService --> InterpolationService
  IDFService --> RepositoryUF
  IDFService --> RepositoryMunicipio
  IDFService --> RepositoryEstacao
  IDFService --> RepositoryIDFEquation
  DatasetService --> RepositoryDataset
  DatasetService --> RepositoryReference
  DatasetService --> RepositoryIDFEquation
  InterpolationService --> RepositoryEstacao
  InterpolationService --> RepositoryIDFEquation
```

---

## 5. Diagrama de Sequência – Cálculo IDF (Mermaid)

```mermaid
sequenceDiagram
  participant U as Usuário
  participant FE as Frontend
  participant API as Backend API
  participant SVC as IDFService
  participant LEG as LegacyIDFCalculator
  participant MOD as ModernIDFCalculator
  participant INT as InterpolationService
  participant DB as BancoDados

  U->>FE: Seleciona UF/Município/Estação e informa duração/TR
  FE->>API: POST /v1/idf/calculate (localização, duracao, TR, modo)
  API->>SVC: calculate(request)
  SVC->>DB: Buscar equação local
  DB-->>SVC: Equação encontrada ou nula

  alt Equação não encontrada
    SVC->>INT: interpolar(ponto, regra)
    INT->>DB: Buscar estações vizinhas
    DB-->>INT: Estações e equações
    INT-->>SVC: Equação interpolada
  end

  alt modo == LEGADO
    SVC->>LEG: calculate(K, a, b, c, duracao, TR)
    LEG-->>SVC: intensidade
  else modo == MODERNO
    SVC->>MOD: calculateGEV(params, duracao, TR)
    MOD-->>SVC: intensidade
  end

  SVC-->>API: IDFResult (intensidade, parametros, equation_id, reference_code, flags)
  API-->>FE: JSON IDFResult
  FE-->>U: Exibe intensidade, K/a/b/c, curva e opção de relatório
```

---

## 6. Diagrama de Atividades – Fluxo do Usuário (Mermaid)

```mermaid
flowchart TD
  A([Início]) --> B[Acessar Pluvio Web]
  B --> C[Selecionar UF no mapa]
  C --> D{Busca por...}
  D -->|Município| E[Selecionar município da lista]
  D -->|Estação| F[Selecionar estação da lista]
  D -->|Coordenada| G[Clicar no mapa ou digitar lat/lon]
  E --> H[Preencher duração e TR]
  F --> H
  G --> H
  H --> I{Modo de cálculo}
  I -->|Legado| J[Fórmula Sherman K,a,b,c]
  I -->|Moderno| K[GEV / LH-moments]
  I -->|Auto| L[Sistema decide conforme disponibilidade]
  J --> M[Calcular intensidade IDF]
  K --> M
  L --> M
  M --> N{Equação local disponível?}
  N -->|Sim| O[Exibir equação local com referência]
  N -->|Não| P[Aviso de interpolação IDW/Kriging]
  O --> Q[Exibir tabela I x duração x TR]
  P --> Q
  Q --> R{Gerar relatório?}
  R -->|Sim| S[Exportar PDF/JSON com equation_id, versão e referência]
  R -->|Não| T([Fim])
  S --> T
```

---

## 7. Diagrama de Atividades – Pipeline de Atualização de Dados (Mermaid)

```mermaid
flowchart TD
  A([Início Pipeline]) --> B{Tipo de fonte}
  B -->|XLSX oficial| C[Upload planilha IDF_Curves_Brazil.xlsx]
  B -->|PDF avulso| D[Upload PDF técnico]
  B -->|API HidroWeb / INMET| E[Ingestão automática via script Python]
  B -->|CHIRPS| F[Acesso via Google Earth Engine]
  C --> G[Registrar Dataset em staging no idf_datasets]
  D --> H[Extrair K,a,b,c e referência assistido pelo operador]
  E --> G
  F --> G
  H --> G
  G --> I[Processar e calcular equações no motor hidrológico]
  I --> J[Inserir em idf_equations com status staging]
  J --> K[Validação técnica - operador confere R² e metadados]
  K --> L{Aprovado?}
  L -->|Não| M[Retornar para correção]
  M --> I
  L -->|Sim| N[Publicar nova versão do dataset]
  N --> O[Marcar equações antigas como deprecadas]
  O --> P[Registrar em idf_updates - auditoria completa]
  P --> Q([Fim Pipeline])
```

---

## 8. Diagrama de Sequência – Importação XLSX pelo Admin (Mermaid)

```mermaid
sequenceDiagram
  participant ADM as Admin
  participant FE as Frontend Admin
  participant API as Backend API
  participant DS as DatasetService
  participant DB as BancoDados

  ADM->>FE: Faz upload do XLSX
  FE->>API: POST /v1/admin/import/xlsx (multipart/form-data)
  API->>DS: importXLSX(arquivo)
  DS->>DB: Cria registro Dataset (status=staging)
  DS->>DS: Processa linhas XLSX, extrai K,a,b,c por localidade
  DS->>DB: Insere IDFEquations (status=staging)
  DS-->>API: DatasetDTO (id, total_equacoes, erros)
  API-->>FE: 201 Created + DatasetDTO
  FE-->>ADM: Exibe resumo (equações importadas, avisos)

  ADM->>FE: Clica em Publicar Dataset
  FE->>API: POST /v1/admin/datasets/{id}/publish
  API->>DS: publicarDataset(id)
  DS->>DB: Ativa equações (status=publicado)
  DS->>DB: Depreca versão anterior
  DS->>DB: Registra UpdateLog
  DS-->>API: versao_publicada
  API-->>FE: 200 OK + versao
  FE-->>ADM: Confirmação de publicação
```

---

## 9. Contrato OpenAPI – Endpoints Principais (Mermaid)

```mermaid
flowchart LR
  subgraph API_Publica["API Pública v1 - Rate limit + API Key"]
    E1["GET /v1/ufs → lista de UFs"]
    E2["GET /v1/municipios?uf=XX → municípios por UF"]
    E3["GET /v1/estacoes?uf=XX → estações"]
    E4["POST /v1/idf/calculate → calcula intensidade IDF"]
    E5["GET /v1/idf/equations/{id} → metadados da equação"]
    E6["GET /v1/references/{code} → referência bibliográfica"]
  end

  subgraph API_Admin["API Administrativa v1/admin - JWT + RBAC"]
    A1["POST /v1/admin/import/xlsx → importa planilha"]
    A2["POST /v1/admin/import/pdf → cadastra PDF"]
    A3["POST /v1/admin/datasets/{id}/publish → publica versão"]
    A4["GET /v1/admin/datasets → lista datasets"]
    A5["GET /v1/admin/audit → histórico de atualizações"]
  end
```

---

## 10. Payload de Resposta – POST /v1/idf/calculate

```json
{
  "input": {
    "latitude": -20.7546,
    "longitude": -42.8825,
    "duracao_min": 60,
    "TR_anos": 25,
    "modo": "LEGADO"
  },
  "resultado": {
    "intensidade_mm_h": 72.43,
    "unidade": "mm/h"
  },
  "equacao": {
    "equation_id": 1042,
    "equation_version": "v2025.03",
    "modelo": "SHERMAN",
    "modo": "LEGADO",
    "K": 1285.7,
    "a": 0.185,
    "b": 18.0,
    "c": 0.79,
    "duracao_min": 10,
    "duracao_max": 1440,
    "TR_min": 2,
    "TR_max": 100
  },
  "referencia": {
    "reference_code": "FIORIO_2012",
    "titulo": "Plúvio 2.1 - GPRH/UFV",
    "ano": 2012,
    "link": "http://www.gprh.ufv.br"
  },
  "localidade": {
    "uf": "MG",
    "municipio": "Viçosa",
    "estacao": "02042007",
    "tipo_equacao": "LOCAL"
  },
  "flags": {
    "interpolada": false,
    "extrapolada": false,
    "aviso": null,
    "dataset_id": 7
  }
}
```

---

## 11. DDL SQL – Banco de Dados (PostgreSQL + PostGIS)

```sql
-- Habilitar extensão geográfica
CREATE EXTENSION IF NOT EXISTS postgis;

-- UF
CREATE TABLE uf (
  id_uf     SERIAL PRIMARY KEY,
  sigla     CHAR(2) NOT NULL UNIQUE,
  nome      VARCHAR(50) NOT NULL
);

-- Município
CREATE TABLE municipio (
  id_municipio  SERIAL PRIMARY KEY,
  id_uf         INT NOT NULL REFERENCES uf(id_uf),
  nome          VARCHAR(100) NOT NULL,
  cod_ibge      CHAR(7) UNIQUE
);

-- Estação pluviométrica
CREATE TABLE estacao (
  id_estacao      SERIAL PRIMARY KEY,
  id_municipio    INT NOT NULL REFERENCES municipio(id_municipio),
  codigo_oficial  VARCHAR(20) UNIQUE,
  nome            VARCHAR(100),
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  geom            GEOMETRY(Point, 4326),
  altitude_m      DOUBLE PRECISION,
  fonte_geometria VARCHAR(50)
);
CREATE INDEX idx_estacao_geom ON estacao USING GIST(geom);

-- Referência bibliográfica
CREATE TABLE reference (
  code        VARCHAR(50) PRIMARY KEY,
  titulo      TEXT NOT NULL,
  autores     TEXT,
  ano         INT,
  tipo        VARCHAR(30),
  link        TEXT,
  arquivo_pdf TEXT
);

-- Dataset de origem
CREATE TABLE dataset (
  id_dataset      SERIAL PRIMARY KEY,
  descricao       TEXT,
  origem          VARCHAR(50) NOT NULL,
  periodo_inicio  DATE,
  periodo_fim     DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'staging',
  data_importacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Equações IDF
CREATE TABLE idf_equation (
  id_equation     SERIAL PRIMARY KEY,
  id_estacao      INT REFERENCES estacao(id_estacao),
  id_municipio    INT REFERENCES municipio(id_municipio),
  id_uf           INT REFERENCES uf(id_uf),
  id_dataset      INT NOT NULL REFERENCES dataset(id_dataset),
  reference_code  VARCHAR(50) REFERENCES reference(code),
  modelo          VARCHAR(30) NOT NULL DEFAULT 'SHERMAN',
  modo            VARCHAR(20) NOT NULL DEFAULT 'LEGADO',
  K               DOUBLE PRECISION,
  a               DOUBLE PRECISION,
  b               DOUBLE PRECISION,
  c               DOUBLE PRECISION,
  duracao_min     INT,
  duracao_max     INT,
  TR_min          INT,
  TR_max          INT,
  qualidade_ajuste DOUBLE PRECISION,
  versao          VARCHAR(20),
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_idf_equation_uf ON idf_equation(id_uf);
CREATE INDEX idx_idf_equation_municipio ON idf_equation(id_municipio);
CREATE INDEX idx_idf_equation_estacao ON idf_equation(id_estacao);
CREATE INDEX idx_idf_equation_ativo ON idf_equation(ativo);

-- Regras de interpolação
CREATE TABLE interpolation_rule (
  id_regra       SERIAL PRIMARY KEY,
  escopo         VARCHAR(50),
  metodo         VARCHAR(20) NOT NULL DEFAULT 'IDW',
  parametros_json JSONB,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Log de atualizações
CREATE TABLE update_log (
  id_update   SERIAL PRIMARY KEY,
  id_dataset  INT NOT NULL REFERENCES dataset(id_dataset),
  usuario     VARCHAR(100),
  data        TIMESTAMP NOT NULL DEFAULT NOW(),
  tipo        VARCHAR(30),
  descricao   TEXT
);
```

---

## 12. Diagrama de Deploy / Infraestrutura (Mermaid)

```mermaid
flowchart TB
  subgraph Internet
    USER["👤 Usuário - Navegador"]
    EXTAPI["🔌 Sistema Externo - API Key"]
  end

  subgraph Cloud["Cloud (Vercel / Railway / Render)"]
    subgraph FrontendTier["Tier Frontend"]
      NEXT["Next.js / React - Vercel CDN"]
    end
    subgraph BackendTier["Tier Backend"]
      API_NODE["API Backend - Node/Nest ou FastAPI"]
      MOTOR["Motor Hidrológico - Python service"]
    end
    subgraph DataTier["Tier Dados"]
      PGDB["PostgreSQL + PostGIS"]
      STORAGE["Object Storage - PDFs / XLSX"]
      CACHE["Redis - rate limit / cache"]
    end
    subgraph JobsTier["Jobs / Background"]
      WORKER["Worker Python - ingestão HidroWeb, INMET, CHIRPS"]
      SCHEDULER["Scheduler - cron jobs"]
    end
  end

  subgraph ExternalSources["Fontes Externas"]
    HIDROWEB["ANA HidroWeb API"]
    INMET_API["INMET API"]
    GEE["Google Earth Engine - CHIRPS"]
  end

  USER -->|HTTPS| NEXT
  NEXT -->|REST JSON| API_NODE
  EXTAPI -->|REST + API Key| API_NODE
  API_NODE -->|calcular IDF| MOTOR
  API_NODE -->|SQL| PGDB
  API_NODE -->|Arquivos| STORAGE
  API_NODE -->|Cache| CACHE
  MOTOR -->|SQL| PGDB
  WORKER -->|Pull dados| HIDROWEB
  WORKER -->|Pull dados| INMET_API
  WORKER -->|Pull dados| GEE
  WORKER -->|Insert staging| PGDB
  SCHEDULER -->|Aciona| WORKER
```

---

## 13. Diagrama de Estado – Ciclo de Vida de uma Equação IDF (Mermaid)

```mermaid
stateDiagram-v2
  [*] --> Importada : importXLSX / importPDF
  Importada --> EmValidacao : operador abre revisão
  EmValidacao --> Aprovada : operador aprova
  EmValidacao --> Importada : operador rejeita (corrigir)
  Aprovada --> Publicada : publicarDataset()
  Publicada --> Deprecada : nova versão publicada
  Deprecada --> [*] : mantida no histórico (nunca removida)
```

---

## 14. Motor de Cálculo – Exemplos de Código Python

### 14.1 Calculadora Legada (Sherman)

```python
# services/legacy_calculator.py

def calcular_intensidade_sherman(K: float, a: float, b: float, c: float,
                                  duracao_min: int, TR_anos: int) -> float:
    """
    Fórmula IDF tipo Sherman (compatível com Plúvio 2.1):
    I = K * TR^a / (t + b)^c
    Retorna intensidade em mm/h.
    """
    return K * (TR_anos ** a) / ((duracao_min + b) ** c)
```

### 14.2 Calculadora Moderna (GEV)

```python
# services/modern_calculator.py

import numpy as np
from scipy.stats import genextreme

def ajustar_gev(serie_maximas: list[float]) -> dict:
    """
    Ajusta distribuição GEV à série de máximas anuais.
    Retorna parâmetros: shape (xi), loc (mu), scale (sigma).
    """
    xi, mu, sigma = genextreme.fit(serie_maximas)
    return {"xi": xi, "mu": mu, "sigma": sigma}

def calcular_quantil_gev(params: dict, TR_anos: int) -> float:
    """
    Retorna quantil de precipitação para dado TR (mm/h).
    """
    prob_nao_excedencia = 1 - (1 / TR_anos)
    return genextreme.ppf(prob_nao_excedencia,
                          c=params["xi"],
                          loc=params["mu"],
                          scale=params["sigma"])

def desagregar_chuva_diaria(Pd_mm: float, duracao_min: int,
                              metodo: str = "CETESB") -> float:
    """
    Desagregação de chuva diária para subdiária.
    Coeficientes padrão CETESB/Marques (método clássico brasileiro).
    Retorna intensidade em mm/h.
    """
    coeficientes = {
        1440: 1.00, 720: 0.84, 600: 0.81, 480: 0.78,
        360:  0.74, 240: 0.69, 120: 0.61,  60: 0.52,
         30:  0.43,  20: 0.39,  15: 0.36,  10: 0.32,
          5:  0.27
    }
    duracao_valida = min(coeficientes.keys(),
                        key=lambda x: abs(x - duracao_min))
    Pt = Pd_mm * coeficientes[duracao_valida]
    duracao_h = duracao_valida / 60
    return Pt / duracao_h
```

### 14.3 Interpolação Espacial (IDW)

```python
# services/interpolation.py

import numpy as np

def interpolar_idw(ponto_alvo: tuple[float, float],
                   estacoes: list[dict],
                   potencia: int = 5) -> dict:
    """
    Interpolação IDW (Inverse Distance Weighting) para parâmetros K,a,b,c.
    ponto_alvo: (lat, lon)
    estacoes: lista de dicts com lat, lon, K, a, b, c
    Retorna dict com K, a, b, c interpolados.
    """
    lat0, lon0 = ponto_alvo
    pesos = []
    for est in estacoes:
        dist = np.sqrt((est["lat"] - lat0)**2 + (est["lon"] - lon0)**2)
        if dist == 0:
            return {"K": est["K"], "a": est["a"],
                    "b": est["b"], "c": est["c"]}
        pesos.append(1 / dist**potencia)

    total = sum(pesos)
    K = sum(p * e["K"] for p, e in zip(pesos, estacoes)) / total
    a = sum(p * e["a"] for p, e in zip(pesos, estacoes)) / total
    b = sum(p * e["b"] for p, e in zip(pesos, estacoes)) / total
    c = sum(p * e["c"] for p, e in zip(pesos, estacoes)) / total
    return {"K": K, "a": a, "b": b, "c": c}
```

---

## 15. Compatibilidade com Plúvio 2.1 – Checklist

- [ ] Fluxo UF → município/estação idêntico ao 2.1
- [ ] Banco inicial carregado com K, a, b, c originais do 2.1
- [ ] Modo LEGADO como padrão nas regiões sem equação moderna validada
- [ ] Aviso de interpolação/extrapolação explícito (como no desktop)
- [ ] Relatório com estrutura narrativa compatível com o 2.1
- [ ] Cobertura inicial: MG, SP, PR, RJ, ES, BA, TO + localidades avulsas
- [ ] equation_version + reference_code em todo relatório gerado

---

## 16. Matriz de Módulos Principais

| Módulo | Stack | Responsabilidade |
|---|---|---|
| Frontend Web | Next.js + React + Leaflet | Mapa, seleção, formulário IDF, relatório |
| API Backend | Node/NestJS ou FastAPI | Endpoints públicos + admin, autenticação |
| Motor Hidrológico | Python + NumPy/SciPy | Sherman, GEV, desagregação, IDW/Kriging |
| Worker de Ingestão | Python + Pandas | HidroWeb, INMET, CHIRPS, XLSX, PDF |
| Banco de Dados | PostgreSQL + PostGIS | Equações, estações, referências, versões |
| Cache | Redis | Rate limit, cache de consultas frequentes |
| Storage | S3 / Object Storage | PDFs técnicos, planilhas importadas |
| Scheduler | Cron / Celery Beat | Trigger de atualização periódica de dados |

---

*Pluvio Web 3.x – Arquitetura completa v1.0*
*André Phillipe dos Santos Batista – 2026*
