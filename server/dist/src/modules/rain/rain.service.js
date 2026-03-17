"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RainService = void 0;
const common_1 = require("@nestjs/common");
let RainService = class RainService {
    constructor() {
        this.coefTables = {
            CETESB_DAEE: [
                { duracaoMin: 5, coef: 0.12 },
                { duracaoMin: 10, coef: 0.19 },
                { duracaoMin: 15, coef: 0.24 },
                { duracaoMin: 30, coef: 0.38 },
                { duracaoMin: 60, coef: 0.54 },
                { duracaoMin: 120, coef: 0.72 },
                { duracaoMin: 180, coef: 0.79 },
                { duracaoMin: 360, coef: 0.88 },
                { duracaoMin: 720, coef: 0.95 },
                { duracaoMin: 1440, coef: 1.0 },
            ],
            REGIONAL_SUDESTE: [
                { duracaoMin: 5, coef: 0.14 },
                { duracaoMin: 10, coef: 0.21 },
                { duracaoMin: 15, coef: 0.27 },
                { duracaoMin: 30, coef: 0.41 },
                { duracaoMin: 60, coef: 0.57 },
                { duracaoMin: 120, coef: 0.74 },
                { duracaoMin: 180, coef: 0.81 },
                { duracaoMin: 360, coef: 0.89 },
                { duracaoMin: 720, coef: 0.96 },
                { duracaoMin: 1440, coef: 1.0 },
            ],
        };
        this.metodoMetadata = {
            CETESB_DAEE: "Relações clássicas CETESB/DAEE",
            REGIONAL_SUDESTE: "Relações regionais Sudeste (calibração inicial)",
            KIMBALL: "Método de Kimball — coef = (t/1440)^0,305",
            KNOESSEN: "Método de Knoessen — coef = (t/1440)^0,3054",
        };
    }
    disaggregate(input) {
        const fatorCorrecao = input.fatorCorrecao ?? 1;
        const duracoesOrdenadas = [...new Set(input.duracoesMin)].sort((a, b) => a - b);
        const resultados = duracoesOrdenadas.map((duracaoMin) => {
            const coefBase = this.calcCoef(input.metodo, duracaoMin);
            const coef = coefBase * fatorCorrecao;
            const laminaMm = input.chuva24hMm * coef;
            const intensidadeMmH = laminaMm / (duracaoMin / 60);
            return {
                duracao_min: duracaoMin,
                coeficiente: Number(coef.toFixed(4)),
                lamina_mm: Number(laminaMm.toFixed(3)),
                intensidade_mm_h: Number(intensidadeMmH.toFixed(3)),
            };
        });
        return {
            input: {
                chuva24h_mm: input.chuva24hMm,
                duracoes_min: duracoesOrdenadas,
                metodo: input.metodo,
                fator_correcao: fatorCorrecao,
            },
            output: resultados,
            metadata: {
                fonte_coeficientes: this.metodoMetadata[input.metodo],
                observacao: "Desagregação por relações de duração com interpolação linear entre pontos de referência.",
            },
        };
    }
    calcCoef(metodo, duracaoMin) {
        if (metodo === "KIMBALL") {
            return Math.pow(duracaoMin / 1440, 0.305);
        }
        if (metodo === "KNOESSEN") {
            return Math.pow(duracaoMin / 1440, 0.3054);
        }
        const table = this.coefTables[metodo];
        return this.interpolateCoef(table, duracaoMin);
    }
    interpolateCoef(table, targetDurationMin) {
        if (targetDurationMin <= table[0].duracaoMin)
            return table[0].coef;
        if (targetDurationMin >= table[table.length - 1].duracaoMin)
            return table[table.length - 1].coef;
        for (let i = 0; i < table.length - 1; i++) {
            const cur = table[i];
            const nxt = table[i + 1];
            if (targetDurationMin >= cur.duracaoMin && targetDurationMin <= nxt.duracaoMin) {
                const ratio = (targetDurationMin - cur.duracaoMin) / (nxt.duracaoMin - cur.duracaoMin);
                return cur.coef + ratio * (nxt.coef - cur.coef);
            }
        }
        return table[table.length - 1].coef;
    }
};
exports.RainService = RainService;
exports.RainService = RainService = __decorate([
    (0, common_1.Injectable)()
], RainService);
//# sourceMappingURL=rain.service.js.map