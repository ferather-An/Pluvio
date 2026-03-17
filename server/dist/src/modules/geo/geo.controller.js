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
exports.GeoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const geo_service_1 = require("./geo.service");
let GeoController = class GeoController {
    constructor(geoService) {
        this.geoService = geoService;
    }
    getUFs() {
        return this.geoService.listUFs();
    }
    getMunicipios(uf) {
        if (!uf)
            return [];
        return this.geoService.listMunicipios(uf);
    }
    getEstacoes(uf, municipio) {
        return this.geoService.listEstacoes(uf, municipio);
    }
};
exports.GeoController = GeoController;
__decorate([
    (0, common_1.Get)("ufs"),
    (0, swagger_1.ApiOperation)({ summary: "Listar Unidades Federativas com equações cadastradas" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GeoController.prototype, "getUFs", null);
__decorate([
    (0, common_1.Get)("municipios"),
    (0, swagger_1.ApiOperation)({ summary: "Listar municípios de uma UF" }),
    (0, swagger_1.ApiQuery)({ name: "uf", required: false, example: "RJ" }),
    __param(0, (0, common_1.Query)("uf")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GeoController.prototype, "getMunicipios", null);
__decorate([
    (0, common_1.Get)("estacoes"),
    (0, swagger_1.ApiOperation)({ summary: "Listar estações pluviométricas com filtros" }),
    (0, swagger_1.ApiQuery)({ name: "uf", required: false }),
    (0, swagger_1.ApiQuery)({ name: "municipio", required: false }),
    __param(0, (0, common_1.Query)("uf")),
    __param(1, (0, common_1.Query)("municipio")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GeoController.prototype, "getEstacoes", null);
exports.GeoController = GeoController = __decorate([
    (0, swagger_1.ApiTags)("geo"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [geo_service_1.GeoService])
], GeoController);
//# sourceMappingURL=geo.controller.js.map