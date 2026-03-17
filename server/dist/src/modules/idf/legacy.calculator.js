"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyCalculator = void 0;
const common_1 = require("@nestjs/common");
let LegacyCalculator = class LegacyCalculator {
    calculate(K, a, b, c, duracaoMin, trAnos) {
        return K * Math.pow(trAnos, a) / Math.pow(duracaoMin + b, c);
    }
};
exports.LegacyCalculator = LegacyCalculator;
exports.LegacyCalculator = LegacyCalculator = __decorate([
    (0, common_1.Injectable)()
], LegacyCalculator);
//# sourceMappingURL=legacy.calculator.js.map