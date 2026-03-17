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
exports.IdfController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const calculate_idf_dto_1 = require("./dto/calculate-idf.dto");
const idf_service_1 = require("./idf.service");
let IdfController = class IdfController {
    constructor(idfService) {
        this.idfService = idfService;
    }
    calculate(body) {
        return this.idfService.calculate(body);
    }
    getNearestStation(latitude, longitude) {
        return this.idfService.findNearestStation({
            latitude: Number(latitude),
            longitude: Number(longitude),
        });
    }
    getEquationById(id) {
        return this.idfService.getEquationById(id);
    }
};
exports.IdfController = IdfController;
__decorate([
    (0, common_1.Post)("calculate"),
    (0, swagger_1.ApiOperation)({ summary: "Calcular intensidade de chuva pela equação de Sherman" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Resultado com intensidade (mm/h), equação e flags" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_idf_dto_1.CalculateIdfDto]),
    __metadata("design:returntype", void 0)
], IdfController.prototype, "calculate", null);
__decorate([
    (0, common_1.Get)("nearest"),
    (0, swagger_1.ApiOperation)({ summary: "Estação pluviométrica mais próxima de um ponto" }),
    (0, swagger_1.ApiQuery)({ name: "latitude", required: true, example: -22.9 }),
    (0, swagger_1.ApiQuery)({ name: "longitude", required: true, example: -43.2 }),
    __param(0, (0, common_1.Query)("latitude")),
    __param(1, (0, common_1.Query)("longitude")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], IdfController.prototype, "getNearestStation", null);
__decorate([
    (0, common_1.Get)("equations/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Buscar equação IDF por ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IdfController.prototype, "getEquationById", null);
exports.IdfController = IdfController = __decorate([
    (0, swagger_1.ApiTags)("idf"),
    (0, common_1.Controller)("idf"),
    __metadata("design:paramtypes", [idf_service_1.IdfService])
], IdfController);
//# sourceMappingURL=idf.controller.js.map