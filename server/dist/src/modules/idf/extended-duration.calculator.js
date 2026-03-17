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
exports.ExtendedDurationCalculator = void 0;
const common_1 = require("@nestjs/common");
const legacy_calculator_1 = require("./legacy.calculator");
let ExtendedDurationCalculator = class ExtendedDurationCalculator {
    constructor(legacyCalculator) {
        this.legacyCalculator = legacyCalculator;
        this.maxLegacyDurationMin = 1440;
    }
    calculate(input) {
        if (input.duracaoMin <= this.maxLegacyDurationMin) {
            return {
                intensidade: this.legacyCalculator.calculate(input.K, input.a, input.b, input.c, input.duracaoMin, input.trAnos),
                family: "SHERMAN",
                method: null,
                anchorDurationMin: input.duracaoMin,
            };
        }
        const method = input.metodo ?? "KIMBALL";
        const exponent = method === "KNOESSEN" ? 0.3054 : 0.305;
        const intensidade24h = this.legacyCalculator.calculate(input.K, input.a, input.b, input.c, this.maxLegacyDurationMin, input.trAnos);
        const lamina24h = intensidade24h * (this.maxLegacyDurationMin / 60);
        const fatorDuracao = Math.pow(input.duracaoMin / this.maxLegacyDurationMin, exponent);
        const laminaEstendida = lamina24h * fatorDuracao;
        const intensidadeEstendida = laminaEstendida / (input.duracaoMin / 60);
        return {
            intensidade: intensidadeEstendida,
            family: "DURACAO_LONGA",
            method,
            anchorDurationMin: this.maxLegacyDurationMin,
        };
    }
};
exports.ExtendedDurationCalculator = ExtendedDurationCalculator;
exports.ExtendedDurationCalculator = ExtendedDurationCalculator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [legacy_calculator_1.LegacyCalculator])
], ExtendedDurationCalculator);
//# sourceMappingURL=extended-duration.calculator.js.map