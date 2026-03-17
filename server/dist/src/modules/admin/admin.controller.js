"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getStats() {
        return this.adminService.getStats();
    }
    listDatasets(page, pageSize) {
        return this.adminService.listDatasets(Number(page ?? 1), Number(pageSize ?? 20));
    }
    getDataset(id) {
        return this.adminService.getDataset(id);
    }
    publishDataset(id, req) {
        return this.adminService.publishDataset(id, req.user?.email ?? "system");
    }
    deprecateDataset(id, req) {
        return this.adminService.deprecateDataset(id, req.user?.email ?? "system");
    }
    importXlsx(file, nomeDataset, req) {
        if (!file)
            throw new Error("Arquivo não enviado");
        return this.adminService.importXlsx(file.buffer, nomeDataset ?? "Importação Manual", req.user?.email ?? "system");
    }
    listAuditLog(page, pageSize) {
        return this.adminService.listAuditLog(Number(page ?? 1), Number(pageSize ?? 50));
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)("stats"),
    (0, swagger_1.ApiOperation)({ summary: "Estatísticas gerais do banco de dados" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("datasets"),
    (0, swagger_1.ApiOperation)({ summary: "Listar datasets com contagem de equações" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false }),
    (0, swagger_1.ApiQuery)({ name: "pageSize", required: false }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("pageSize")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listDatasets", null);
__decorate([
    (0, common_1.Get)("datasets/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Detalhes de um dataset (primeiras 50 equações)" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDataset", null);
__decorate([
    (0, common_1.Post)("datasets/:id/publish"),
    (0, swagger_1.ApiOperation)({ summary: "Publicar dataset (STAGING → PUBLISHED)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "publishDataset", null);
__decorate([
    (0, common_1.Post)("datasets/:id/deprecate"),
    (0, swagger_1.ApiOperation)({ summary: "Deprecar dataset (PUBLISHED → DEPRECATED)" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deprecateDataset", null);
__decorate([
    (0, common_1.Post)("import/xlsx"),
    (0, swagger_1.ApiOperation)({ summary: "Importar equações IDF de planilha XLSX" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)("nomeDataset")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "importXlsx", null);
__decorate([
    (0, common_1.Get)("audit"),
    (0, swagger_1.ApiOperation)({ summary: "Log de auditoria de ações administrativas" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false }),
    (0, swagger_1.ApiQuery)({ name: "pageSize", required: false }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("pageSize")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listAuditLog", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)("admin"),
    (0, swagger_1.ApiBearerAuth)("jwt"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("admin"),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map