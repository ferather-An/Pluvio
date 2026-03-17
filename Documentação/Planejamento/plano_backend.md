# Pluvio Web 3.x — Plano de Desenvolvimento Backend

> Stack: Node.js + NestJS + Prisma + PostgreSQL/PostGIS + Redis  
> Motor Hidrológico: Python + FastAPI + SciPy + GeoPandas

---

## Estrutura de Pastas Detalhada

```text
server/
  src/
    app.module.ts
    main.ts
    config/
      database.config.ts
      redis.config.ts
      jwt.config.ts
      swagger.config.ts
    modules/
      auth/
        auth.module.ts
        auth.controller.ts
        auth.service.ts
        strategies/
          jwt.strategy.ts
          local.strategy.ts
        guards/
          jwt-auth.guard.ts
          roles.guard.ts
        decorators/
          roles.decorator.ts
        dto/
          login.dto.ts
      ufs/
        ufs.module.ts
        ufs.controller.ts
        ufs.service.ts
      municipios/
        municipios.module.ts
        municipios.controller.ts
        municipios.service.ts
      estacoes/
        estacoes.module.ts
        estacoes.controller.ts
        estacoes.service.ts
      idf/
        idf.module.ts
        idf.controller.ts
        idf.service.ts
        calculators/
          legacy.calculator.ts
          motor.client.ts
        dto/
          calculate-idf.dto.ts
          idf-result.dto.ts
          idf-equation.dto.ts
      datasets/
        datasets.module.ts
        datasets.controller.ts
        datasets.service.ts
        parsers/
          xlsx.parser.ts
          pdf.parser.ts
        dto/
          import-dataset.dto.ts
          publish-dataset.dto.ts
      references/
        references.module.ts
        references.controller.ts
        references.service.ts
      admin/
        admin.module.ts
        admin.controller.ts
        admin.service.ts
      interpolation/
        interpolation.module.ts
        interpolation.service.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
    common/
      filters/
        http-exception.filter.ts
      interceptors/
        logging.interceptor.ts
      pipes/
        validation.pipe.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
  test/
    app.e2e-spec.ts
    idf.e2e-spec.ts
  .env
  nest-cli.json
  tsconfig.json
  package.json
  Dockerfile
```

---

## FASE 0 — Setup Backend

### Checklist

#### Inicialização
- [ ] `nest new server` e confirmar que compila
- [ ] Copiar `package.backend.json` e rodar `npm install`
- [ ] Configurar `tsconfig.json` com paths e strict mode
- [ ] Configurar `nest-cli.json`

#### Prisma
- [ ] `npx prisma init`
- [ ] Colar `schema.prisma` completo
- [ ] `npx prisma migrate dev --name init`
- [ ] `npx prisma generate`
- [ ] Criar `prisma.service.ts` com `onModuleInit` e `onModuleDestroy`
- [ ] Registrar `PrismaModule` como global

#### Configurações base
- [ ] Instalar e configurar `@nestjs/config` com `.env`
- [ ] Criar `database.config.ts`, `redis.config.ts`, `jwt.config.ts`
- [ ] Configurar `ValidationPipe` global com `class-validator`
- [ ] Configurar `HttpExceptionFilter` global
- [ ] Criar endpoint `GET /health`

#### Redis
- [ ] Configurar `cache-manager` com Redis
- [ ] Testar `GET /health` com cache

---

## FASE 1 — Módulo IDF Legado

### Checklist

#### Seed de dados
- [ ] Criar `prisma/seed.ts`
- [ ] Inserir UFs: MG, SP, PR, RJ, ES, BA, TO
- [ ] Inserir municípios e estações das localidades do Plúvio 2.1
- [ ] Inserir equações IDF com `modo=LEGADO`, `modelo=SHERMAN`
- [ ] Inserir referência `FIORIO_2012`
- [ ] Rodar `npx prisma db seed` e validar contagem

#### LegacyCalculator
- [ ] Criar `legacy.calculator.ts`
- [ ] Implementar método `calculate(K, a, b, c, duracao, TR): number`
- [ ] Fórmula: `I = K * TR^a / (t + b)^c`
- [ ] Teste unitário: resultado para Viçosa-MG t=60 TR=25 deve bater com Plúvio 2.1

#### IDFService (modo legado)
- [ ] Criar `idf.service.ts`
- [ ] Método `findEquation(filtros)`: busca por estação → município → UF
- [ ] Método `calculate(request)`: chama `LegacyCalculator`, monta `IDFResult`
- [ ] Adicionar flag `interpolada: false/true` no resultado
- [ ] Adicionar `equation_id`, `equation_version`, `reference_code` no resultado

#### Controller e DTOs
- [ ] Criar `calculate-idf.dto.ts` com validação Zod/class-validator
- [ ] Criar `idf-result.dto.ts`
- [ ] `POST /v1/idf/calculate` chamando `IDFService.calculate`
- [ ] `GET /v1/idf/equations/:id`

#### UFs, Municípios, Estações
- [ ] `GET /v1/ufs`
- [ ] `GET /v1/municipios?uf=XX`
- [ ] `GET /v1/estacoes?uf=XX&municipio=YYY`
- [ ] Cache Redis de 1h nas listas estáticas

---

## FASE 2 — Importação de Dados

### Checklist

#### XLSXParser
- [ ] Criar `xlsx.parser.ts`
- [ ] Ler arquivo com biblioteca `xlsx`
- [ ] Mapear colunas para modelo de equação
- [ ] Retornar array de `IDFEquationRaw` com erros de linha separados

#### PDFParser
- [ ] Criar `pdf.parser.ts`
- [ ] Extrair texto com `pdf-parse`
- [ ] Estrutura de cadastro manual: operador confirma K, a, b, c extraídos

#### DatasetService
- [ ] `importXLSX(file)`: cria Dataset staging + insere equações
- [ ] `importPDF(file)`: salva arquivo no storage + cria Reference
- [ ] `publicarDataset(id)`: ativa equações, depreca versão anterior, loga
- [ ] `listarDatasets(filtros)`: paginado por status
- [ ] Registrar tudo em `UpdateLog`

#### Endpoints admin de importação
- [ ] `POST /v1/admin/import/xlsx` (multipart/form-data)
- [ ] `POST /v1/admin/import/pdf`
- [ ] `POST /v1/admin/datasets/:id/publish`
- [ ] `GET /v1/admin/datasets`
- [ ] `GET /v1/admin/audit`

---

## FASE 3 — Segurança e API Pública

### Checklist

#### Autenticação
- [ ] `AuthModule` com `PassportModule`, `JwtModule`
- [ ] `LocalStrategy` para login com email/senha
- [ ] `JwtStrategy` para validar Bearer token
- [ ] `RolesGuard` para ADMIN, VALIDADOR, READONLY
- [ ] `POST /v1/auth/login` → retorna JWT
- [ ] `POST /v1/auth/refresh`

#### Rate Limit e API Key
- [ ] `ThrottlerModule` global: 100 req/min por IP
- [ ] Middleware `ApiKeyMiddleware` para rotas públicas
- [ ] Header: `x-api-key`
- [ ] Rotas `/admin/*` requerem JWT + role ADMIN ou VALIDADOR

#### Swagger
- [ ] Configurar `SwaggerModule` em `main.ts`
- [ ] Decorar todos os controllers com `@ApiTags`
- [ ] Decorar todos os DTOs com `@ApiProperty`
- [ ] Endpoint `/api/docs` público
- [ ] Exportar `openapi.json` em `/api/docs-json`

---

## FASE 4 — Motor Moderno (Python/FastAPI)

### Checklist

#### Setup FastAPI
- [ ] `main.py` com `FastAPI` e rotas base
- [ ] `GET /health`
- [ ] `POST /calculate/legacy`
- [ ] `POST /calculate/gev`
- [ ] `POST /calculate/disaggregate`
- [ ] `POST /interpolate/idw`
- [ ] `POST /interpolate/kriging`

#### Módulos Python
- [ ] `services/legacy_calculator.py` — Sherman
- [ ] `services/modern_calculator.py` — GEV, LH-moments
- [ ] `services/disaggregation.py` — CETESB, Kimball, Knoessen
- [ ] `services/interpolation.py` — IDW, Kriging
- [ ] `services/hidroweb_client.py` — client ANA
- [ ] `services/inmet_client.py` — client INMET
- [ ] `services/chirps_client.py` — client GEE

#### Testes Python
- [ ] `pytest` para cada calculadora
- [ ] Validar GEV vs série histórica conhecida
- [ ] Validar IDW vs valores de referência

#### Integração NestJS ↔ Motor
- [ ] `motor.client.ts` em NestJS chama Motor via HTTP
- [ ] Timeout configurável (padrão 10s)
- [ ] Fallback para modo legado se Motor não responder

---

## FASE 8 — Testes e Deploy

### Checklist

#### Testes Backend
- [ ] Cobertura unitária ≥ 80% (`jest --coverage`)
- [ ] Teste e2e: `POST /v1/idf/calculate` com payload válido
- [ ] Teste e2e: importação de XLSX
- [ ] Teste e2e: publicação de dataset
- [ ] Validação cruzada vs. Plúvio 2.1 para 5 localidades conhecidas

#### Deploy
- [ ] `Dockerfile.backend` build e push para registry
- [ ] Configurar variáveis de ambiente no provedor
- [ ] Rodar migrations em produção: `prisma migrate deploy`
- [ ] Configurar health check no provedor

---

*Pluvio Web 3.x — Plano Backend v1.0 — 2026*
