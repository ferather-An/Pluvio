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
exports.ReferencesService = void 0;
const common_1 = require("@nestjs/common");
const legacy_equation_repository_1 = require("../../data/legacy-equation.repository");
let ReferencesService = class ReferencesService {
    constructor(repo) {
        this.repo = repo;
    }
    listReferences(input) {
        const allRefs = this.repo.listReferences();
        const allEquations = this.repo.listEstacoes();
        const statsByRef = new Map();
        for (const eq of allEquations) {
            if (!statsByRef.has(eq.referenceCode)) {
                statsByRef.set(eq.referenceCode, { municipios: new Set(), equationCount: 0 });
            }
            const s = statsByRef.get(eq.referenceCode);
            s.municipios.add(`${eq.uf}|${eq.municipio}`);
            s.equationCount += 1;
        }
        let items = allRefs.map((ref) => {
            const stats = statsByRef.get(ref.code);
            return {
                code: ref.code,
                titulo: ref.title ?? ref.code,
                link: ref.link,
                tipoFonte: null,
                totalMunicipios: stats?.municipios.size ?? 0,
                totalEquacoes: stats?.equationCount ?? 0,
            };
        });
        const q = input.q?.trim().toLowerCase();
        if (q) {
            items = items.filter((item) => item.code.toLowerCase().includes(q) ||
                item.titulo.toLowerCase().includes(q) ||
                (item.link ?? "").toLowerCase().includes(q));
        }
        items.sort((a, b) => b.totalEquacoes - a.totalEquacoes || a.code.localeCompare(b.code));
        const total = items.length;
        const start = (input.page - 1) * input.pageSize;
        return {
            items: items.slice(start, start + input.pageSize),
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
        };
    }
    getReferenceByCode(code) {
        const ref = this.repo.findReferenceByCode(code.trim());
        if (!ref) {
            throw new common_1.NotFoundException("Referencia nao encontrada para o codigo informado.");
        }
        const allEquations = this.repo.listEstacoes();
        const refEquations = allEquations.filter((eq) => eq.referenceCode === code.trim());
        const municipioMap = new Map();
        for (const eq of refEquations) {
            const key = `${eq.uf}|${eq.municipio}`;
            if (!municipioMap.has(key)) {
                municipioMap.set(key, { uf: eq.uf, municipio: eq.municipio, estacoes: new Set() });
            }
            municipioMap.get(key).estacoes.add(eq.estacao);
        }
        const municipios = [...municipioMap.values()]
            .map((m) => ({
            uf: m.uf,
            municipio: m.municipio,
            estacoes: [...m.estacoes].sort(),
        }))
            .sort((a, b) => a.uf.localeCompare(b.uf) || a.municipio.localeCompare(b.municipio));
        return {
            code: ref.code,
            titulo: ref.title ?? ref.code,
            link: ref.link,
            tipoFonte: null,
            totalMunicipios: municipioMap.size,
            totalEquacoes: refEquations.length,
            municipios,
        };
    }
};
exports.ReferencesService = ReferencesService;
exports.ReferencesService = ReferencesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [legacy_equation_repository_1.LegacyEquationRepository])
], ReferencesService);
//# sourceMappingURL=references.service.js.map