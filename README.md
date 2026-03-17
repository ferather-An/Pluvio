# Pluvio Web 3.1

Plataforma web de código aberto para geração de **curvas Intensidade-Duração-Frequência (IDF)** aplicadas a projetos de drenagem urbana no Brasil. Moderniza e amplia o software Plúvio 2.1 (UFV/GPRH) com dados contemporâneos, métodos hidrológicos avançados e interface geográfica interativa.

> Desenvolvido por **André Phillipe dos Santos Batista** — ADS 5° Período, Universidade de Vassouras (2026)

---

## Funcionalidades

- **Seleção geográfica interativa** — clique no mapa React-Leaflet ou busca textual por município
- **Cálculo IDF** — modo legado (Equação de Sherman, paridade com Plúvio 2.1) e modo moderno (Distribuição GEV com L-momentos)
- **Desagregação de chuvas diárias** — métodos CETESB/DAEE, Kimball e Knoessen
- **Interpolação espacial** — IDW e Krigagem Ordinária (PyKrige) para municípios sem estação própria
- **Relatório PDF completo** — 3 páginas com tabela IDF, gráfico de curvas (Canvas 2D HiDPI), série temporal simulada (Gumbel) e rastreabilidade total
- **API REST pública** documentada via Swagger/OpenAPI
- **Painel administrativo** protegido por JWT para gestão de datasets e auditoria
- **Importação de datasets XLSX** com validação de parâmetros K, a, b, c
- **Banco de dados versionado** com ciclo de vida STAGING → PUBLISHED → DEPRECATED e log de auditoria

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js / React | 14 / 18 |
| Frontend | Tailwind CSS + shadcn/ui | 3.x |
| Frontend | React-Leaflet | 4.x |
| Frontend | jsPDF + jspdf-autotable | 2.5.x |
| Backend | Node.js / NestJS | 20 / 10 |
| Backend | Passport.js + JWT | — |
| Backend | Prisma ORM | 5.x |
| Banco | PostgreSQL + PostGIS | 16 |
| Cache | Redis | 7 |
| Motor | Python / FastAPI | 3.11 / 0.x |
| Motor | SciPy / NumPy / PyKrige | — |
| Infra | Docker / Docker Compose | — |

---

## Pré-requisitos

### Execução via Docker (recomendado)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20

### Execução local (desenvolvimento)

- Node.js ≥ 20
- pnpm ≥ 8 (ou npm/yarn)
- Python ≥ 3.11
- PostgreSQL ≥ 16 com extensão PostGIS
- Redis ≥ 7

---

## Início Rápido com Docker

```bash
# 1. Clone o repositório
git clone https://github.com/<seu-usuario>/pluvio-web-31.git
cd pluvio-web-31

# 2. Copie e configure as variáveis de ambiente
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env.local

# 3. Suba todos os serviços
docker compose up --build

# 4. Acesse
#   Frontend:    http://localhost:3000
#   API REST:    http://localhost:3001/api/docs  (Swagger)
#   Motor:       http://localhost:8000/docs      (FastAPI docs)
```

> Na primeira execução, o container `server` executa automaticamente
> `prisma migrate deploy` e `prisma db seed` para popular o banco com os
> parâmetros do Plúvio 2.1.

---

## Execução Local (sem Docker)

### Backend (NestJS)

```bash
cd server

# Instalar dependências
npm install

# Configurar .env (veja server/.env.example)
cp .env.example .env

# Executar migrações
npx prisma migrate deploy
npx prisma db seed

# Iniciar em modo desenvolvimento
npm run start:dev
```

### Motor Hidrológico (Python/FastAPI)

```bash
cd motor

# Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

# Instalar dependências
pip install -r requirements.txt

# Iniciar
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Iniciar em modo desenvolvimento
npm run dev
```

---

## Variáveis de Ambiente

### `server/.env`

```env
DATABASE_URL=postgresql://pluvio:pluvio@localhost:5432/pluvio
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua_chave_secreta_aqui
MOTOR_URL=http://localhost:8000
PORT=3001
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Principais Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/geo/ufs` | Lista UFs disponíveis |
| GET | `/geo/municipios?uf=XX` | Lista municípios e estações por UF |
| POST | `/idf/calculate` | Calcula intensidade IDF |
| GET | `/idf/equations/:id` | Parâmetros completos de uma equação |
| POST | `/rain/disaggregate` | Desagregação de chuva diária |
| GET | `/references` | Lista referências bibliográficas |
| POST | `/auth/login` | Autenticação administrativa |
| GET | `/admin/stats` | Estatísticas do sistema (JWT) |
| GET | `/admin/datasets` | Lista datasets (JWT) |
| POST | `/admin/datasets/:id/publish` | Publica dataset (JWT) |
| POST | `/admin/import` | Importa XLSX (JWT) |
| GET | `/admin/audit` | Log de auditoria (JWT) |

Documentação interativa completa em `/api/docs` (Swagger UI).

---

## Painel Administrativo

Acesse `http://localhost:3000/auth/login` com as credenciais configuradas em `JWT_SECRET`.

O painel oferece:
- Dashboard com estatísticas globais
- Gestão de datasets (publicar / deprecar)
- Importação de parâmetros IDF via XLSX
- Log de auditoria com todas as ações realizadas

---

## Estrutura do Projeto

```
pluvio-web-31/
├── server/          # Backend NestJS
├── frontend/        # Frontend Next.js
├── motor/           # Motor hidrológico Python/FastAPI
├── docs/            # Artigo científico e documentação
└── docker-compose.yml
```

Veja [`docs/ESTRUTURA_PROJETO.md`](docs/ESTRUTURA_PROJETO.md) para descrição detalhada de cada pasta e arquivo.

---

## Gerando um Relatório PDF

1. Acesse a interface web
2. Clique no mapa ou busque o município desejado
3. Selecione duração, período de retorno e método de desagregação
4. Clique em **Calcular**
5. Clique em **Exportar Relatório PDF**

O PDF gerado contém 3 páginas: dados e tabela IDF, gráficos (curvas IDF + série temporal), e rastreabilidade completa.

---

## Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona ...'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## Referências Principais

- FIORIO, P. R. et al. Comparação de equações de chuvas intensas para o dimensionamento de sistemas de drenagem no estado de São Paulo. *Engenharia Agrícola*, v. 32, n. 2, 2012.
- GONZAGA, V. N. B. et al. Estimativas de curvas IDF para municípios do Paraná usando GEV. *Observatorio de la Economía Latinoamericana*, v. 22, n. 12, e8163, 2024.
- SGB/CPRM. Atlas Pluviométrico do Brasil. Brasília: CPRM, 2022. Disponível em: https://rigeo.sgb.gov.br
