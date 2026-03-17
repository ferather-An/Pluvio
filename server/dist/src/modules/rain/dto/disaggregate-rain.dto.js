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
exports.DisaggregateRainDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class DisaggregateRainDto {
}
exports.DisaggregateRainDto = DisaggregateRainDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Chuva total em 24h (mm)", minimum: 1, maximum: 1000, example: 80 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], DisaggregateRainDto.prototype, "chuva24hMm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Durações desejadas em minutos (5–1440)",
        type: [Number],
        example: [5, 10, 15, 30, 60, 120, 360, 720, 1440],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.Min)(5, { each: true }),
    (0, class_validator_1.Max)(1440, { each: true }),
    __metadata("design:type", Array)
], DisaggregateRainDto.prototype, "duracoesMin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Método de desagregação",
        enum: ["CETESB_DAEE", "REGIONAL_SUDESTE", "KIMBALL", "KNOESSEN"],
        example: "CETESB_DAEE",
    }),
    (0, class_validator_1.IsIn)(["CETESB_DAEE", "REGIONAL_SUDESTE", "KIMBALL", "KNOESSEN"]),
    __metadata("design:type", String)
], DisaggregateRainDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Fator de correção multiplicativo (padrão 1,0)",
        minimum: 0.1,
        maximum: 3,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], DisaggregateRainDto.prototype, "fatorCorrecao", void 0);
//# sourceMappingURL=disaggregate-rain.dto.js.map