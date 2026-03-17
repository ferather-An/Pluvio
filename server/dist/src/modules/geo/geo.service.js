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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const common_1 = require("@nestjs/common");
const legacy_equation_repository_1 = require("../../data/legacy-equation.repository");
let GeoService = class GeoService {
    constructor(repository) {
        this.repository = repository;
    }
    listUFs() {
        return this.repository.listUFs().map((uf) => ({ uf }));
    }
    listMunicipios(uf) {
        const value = uf.toUpperCase();
        return this.repository.listMunicipios(value).map((municipio) => ({ uf: value, municipio }));
    }
    listEstacoes(uf, municipio) {
        return this.repository.listEstacoes(uf, municipio).map((item) => ({
            id: item.id,
            uf: item.uf,
            municipio: item.municipio,
            estacao: item.estacao,
            latitude: item.latitude,
            longitude: item.longitude,
            referenceCode: item.referenceCode,
        }));
    }
};
exports.GeoService = GeoService;
exports.GeoService = GeoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [legacy_equation_repository_1.LegacyEquationRepository])
], GeoService);
//# sourceMappingURL=geo.service.js.map