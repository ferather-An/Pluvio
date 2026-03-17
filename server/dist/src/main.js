"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger("Bootstrap");
    app.enableCors({ origin: "*" });
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Pluvio Web 3.1 API")
        .setDescription("API REST para cálculo de curvas IDF, desagregação de chuvas e análise hidrológica.\n\n" +
        "Desenvolvido por André Phillipe dos Santos Batista — ADS Universidade de Vassouras, 2026.")
        .setVersion("3.1.0")
        .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "jwt")
        .addApiKey({ type: "apiKey", in: "header", name: "x-api-key" }, "api-key")
        .addTag("geo", "UFs, municípios e estações pluviométricas")
        .addTag("idf", "Cálculo de intensidade de chuva (equação de Sherman)")
        .addTag("rain", "Desagregação de chuva de 24h em sub-diárias")
        .addTag("references", "Fontes bibliográficas e datasets")
        .addTag("admin", "Gestão de datasets e importação (requer JWT)")
        .addTag("auth", "Autenticação e emissão de tokens")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await app.listen(port);
    logger.log(`🚀 Pluvio API rodando em http://localhost:${port}/v1`);
    logger.log(`📚 Swagger em http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map