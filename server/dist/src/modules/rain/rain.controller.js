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
exports.RainController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const disaggregate_rain_dto_1 = require("./dto/disaggregate-rain.dto");
const rain_service_1 = require("./rain.service");
let RainController = class RainController {
    constructor(rainService) {
        this.rainService = rainService;
    }
    disaggregate(body) {
        return this.rainService.disaggregate(body);
    }
};
exports.RainController = RainController;
__decorate([
    (0, common_1.Post)("disaggregate"),
    (0, swagger_1.ApiOperation)({
        summary: "Desagregar chuva de 24h em sub-diárias",
        description: "Converte chuva total de 24h (mm) em lâminas e intensidades para múltiplas durações.\n\n" +
            "**Métodos:** CETESB_DAEE · REGIONAL_SUDESTE · KIMBALL · KNOESSEN",
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Tabela de desagregação por duração" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [disaggregate_rain_dto_1.DisaggregateRainDto]),
    __metadata("design:returntype", void 0)
], RainController.prototype, "disaggregate", null);
exports.RainController = RainController = __decorate([
    (0, swagger_1.ApiTags)("rain"),
    (0, common_1.Controller)("rain"),
    __metadata("design:paramtypes", [rain_service_1.RainService])
], RainController);
//# sourceMappingURL=rain.controller.js.map