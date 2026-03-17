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
exports.IdfService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const extended_duration_calculator_1 = require("./extended-duration.calculator");
let IdfService = class IdfService {
    constructor(extendedDurationCalculator, prisma) {
        this.extendedDurationCalculator = extendedDurationCalculator;
        this.prisma = prisma;
    }
    async getEquationById(id) {
        const equation = await this.prisma.idfEquation.findFirst({
            where: {
                OR: [{ id }, { equationId: id }],
            },
        });
        if (!equation) {
            throw new common_1.NotFoundException("Equacao nao encontrada.");
        }
        const reference = equation.referenceCode
            ? await this.prisma.reference.findUnique({ where: { code: equation.referenceCode } })
            : null;
        return {
            id: equation.equationId ?? equation.id,
            sourceSheet: equation.sourceSheet ?? "Consolidado",
            uf: equation.uf,
            municipio: equation.municipio,
            estacao: equation.estacao,
            modelo: equation.modelo ?? "SHERMAN",
            modo: equation.modo ?? "LEGADO",
            metodo: equation.metodo,
            K: equation.K,
            a: equation.a,
            b: equation.b,
            c: equation.c,
            years: equation.anosDados,
            r2: equation.r2,
            durationRange: equation.faixaDuracao,
            referenceCode: equation.referenceCode,
            referenceTitle: reference?.titulo ?? null,
            referenceLink: reference?.link ?? null,
            disaggregationCoefficients: null,
            disaggregationReferenceCode: null,
            disaggregationReferenceTitle: null,
            disaggregationReferenceLink: null,
            equationVersion: equation.equationVersion,
        };
    }
    async findNearestStation(input) {
        if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
            throw new common_1.NotFoundException("Latitude/longitude invalidas.");
        }
        const equations = await this.prisma.idfEquation.findMany({
            where: {
                status: "PUBLISHED",
                latitude: { not: null },
                longitude: { not: null },
            },
        });
        if (!equations.length) {
            throw new common_1.NotFoundException("Nenhuma estacao com coordenadas disponivel.");
        }
        const nearest = equations
            .map((eq) => ({
            equation: eq,
            distanceM: this.haversineMeters(input.latitude, input.longitude, eq.latitude, eq.longitude),
        }))
            .sort((a, b) => a.distanceM - b.distanceM)[0];
        return {
            id: nearest.equation.equationId ?? nearest.equation.id,
            uf: nearest.equation.uf,
            municipio: nearest.equation.municipio,
            estacao: nearest.equation.estacao,
            latitude: nearest.equation.latitude,
            longitude: nearest.equation.longitude,
            distance_m: Number(nearest.distanceM.toFixed(2)),
        };
    }
    async calculate(input) {
        const requestedMode = (input.modo ?? "AUTO");
        const localRadiusMeters = Number(process.env.INTERPOLATION_LOCAL_RADIUS_METERS ?? 50);
        const interpolationPower = Number(process.env.INTERPOLATION_POWER ?? 2);
        const neighbors = Number(process.env.INTERPOLATION_NEIGHBORS ?? 4);
        let selected = null;
        if (Number.isFinite(input.latitude) &&
            Number.isFinite(input.longitude)) {
            selected = await this.selectByCoordinateRule({
                input,
                requestedMode,
                localRadiusMeters,
                interpolationPower,
                neighbors,
            });
        }
        if (!selected) {
            const equation = await this.findBestMatch({
                uf: input.uf,
                municipio: input.municipio,
                estacao: input.estacao,
                modo: requestedMode,
            });
            if (!equation) {
                throw new common_1.NotFoundException("Nenhuma equacao encontrada para os filtros informados.");
            }
            selected = {
                equation,
                interpolated: !input.municipio && !input.estacao,
                distanceM: null,
                aviso: !input.municipio && !input.estacao ? "Equacao escolhida por fallback de UF." : null,
            };
        }
        const equation = selected.equation;
        const equationMode = (equation.modo ?? "LEGADO").toUpperCase();
        const modeFallback = requestedMode === "MODERNO" && equationMode !== "MODERNO";
        const durationCalculation = this.extendedDurationCalculator.calculate({
            K: equation.K,
            a: equation.a,
            b: equation.b,
            c: equation.c,
            duracaoMin: input.duracao,
            trAnos: input.TR,
            metodo: input.metodoDuracaoLonga,
        });
        const intensidade = durationCalculation.intensidade;
        const reference = equation.referenceCode
            ? await this.prisma.reference.findUnique({ where: { code: equation.referenceCode } })
            : null;
        const aviso = selected.aviso ??
            (modeFallback
                ? "Modo MODERNO solicitado, sem equacao moderna local. Fallback para equacao disponivel."
                : null);
        return {
            input: {
                uf: input.uf.toUpperCase(),
                municipio: input.municipio ?? null,
                estacao: input.estacao ?? null,
                duracao: input.duracao,
                TR: input.TR,
                modo: requestedMode,
                latitude: input.latitude ?? null,
                longitude: input.longitude ?? null,
                metodoDuracaoLonga: input.metodoDuracaoLonga ?? null,
            },
            resultado: {
                intensidade_mm_h: Number(intensidade.toFixed(3)),
                unidade: "mm/h",
            },
            equacao: {
                source_sheet: equation.sourceSheet ?? "Consolidado",
                source_label: this.getSourceLabel(equation.sourceSheet),
                equation_id: equation.equationId ?? equation.id ?? "INTERPOLADO",
                equation_version: equation.equationVersion,
                modelo: equation.modelo ?? "SHERMAN",
                modo: equation.modo ?? "LEGADO",
                metodo: equation.metodo,
                K: Number(equation.K.toFixed(6)),
                a: Number(equation.a.toFixed(6)),
                b: Number(equation.b.toFixed(6)),
                c: Number(equation.c.toFixed(6)),
            },
            referencia: {
                reference_code: equation.referenceCode,
                titulo: reference?.titulo ?? null,
                link: reference?.link ?? null,
            },
            referencia_disaggregation: null,
            localidade: {
                uf: equation.uf,
                municipio: equation.municipio,
                estacao: equation.estacao,
                latitude: equation.latitude,
                longitude: equation.longitude,
            },
            flags: {
                interpolada: selected.interpolated,
                distancia_m: selected.distanceM !== null ? Number(selected.distanceM.toFixed(2)) : null,
                metodo_interpolacao: selected.interpolated ? "IDW" : null,
                aviso,
                familia_duracao: durationCalculation.family,
                metodo_duracao_longa: durationCalculation.method,
                ancora_duracao_min: durationCalculation.anchorDurationMin,
            },
        };
    }
    async selectByCoordinateRule(input) {
        const ufValue = input.input.uf.toUpperCase();
        const equations = await this.prisma.idfEquation.findMany({
            where: {
                uf: ufValue,
                status: "PUBLISHED",
                latitude: { not: null },
                longitude: { not: null },
            },
        });
        if (!equations.length) {
            return null;
        }
        const byDistance = equations
            .map((eq) => ({
            equation: eq,
            distanceM: this.haversineMeters(input.input.latitude, input.input.longitude, eq.latitude, eq.longitude),
        }))
            .sort((a, b) => a.distanceM - b.distanceM);
        const nearest = byDistance[0];
        let localCandidate = null;
        if (input.input.estacao) {
            const selectedByText = await this.findBestMatch({
                uf: input.input.uf,
                municipio: input.input.municipio,
                estacao: input.input.estacao,
                modo: input.requestedMode,
            });
            if (selectedByText?.latitude && selectedByText?.longitude) {
                const selectedDistance = this.haversineMeters(input.input.latitude, input.input.longitude, selectedByText.latitude, selectedByText.longitude);
                if (selectedDistance <= input.localRadiusMeters) {
                    localCandidate = selectedByText;
                }
            }
        }
        if (!localCandidate && nearest.distanceM <= input.localRadiusMeters) {
            const sameStation = equations.filter((eq) => this.normalizeText(eq.estacao) === this.normalizeText(nearest.equation.estacao) &&
                this.normalizeText(eq.municipio) === this.normalizeText(nearest.equation.municipio));
            localCandidate = this.pickBestEquationForMode(sameStation, input.requestedMode);
        }
        if (localCandidate) {
            return {
                equation: localCandidate,
                interpolated: false,
                distanceM: this.haversineMeters(input.input.latitude, input.input.longitude, localCandidate.latitude, localCandidate.longitude),
                aviso: null,
            };
        }
        const stationBuckets = new Map();
        for (const eq of equations) {
            const key = `${this.normalizeText(eq.estacao)}|${this.normalizeText(eq.municipio)}`;
            if (!stationBuckets.has(key)) {
                stationBuckets.set(key, []);
            }
            stationBuckets.get(key).push(eq);
        }
        const stationBest = [...stationBuckets.values()]
            .map((bucket) => this.pickBestEquationForMode(bucket, input.requestedMode))
            .filter((eq) => Boolean(eq))
            .map((eq) => ({
            equation: eq,
            distanceM: this.haversineMeters(input.input.latitude, input.input.longitude, eq.latitude, eq.longitude),
        }))
            .sort((a, b) => a.distanceM - b.distanceM)
            .slice(0, input.neighbors);
        if (!stationBest.length) {
            return null;
        }
        const interpolated = this.interpolateEquationByIdw({
            points: stationBest,
            power: input.interpolationPower,
            uf: ufValue,
            latitude: input.input.latitude,
            longitude: input.input.longitude,
        });
        return {
            equation: interpolated,
            interpolated: true,
            distanceM: nearest.distanceM,
            aviso: input.input.elevacaoM !== undefined
                ? "Interpolacao IDW aplicada. Elevacao informada, sem ajuste altimetrico (dataset sem cotas das estacoes)."
                : `Interpolacao IDW aplicada (ponto fora do raio local de ${input.localRadiusMeters} m).`,
        };
    }
    interpolateEquationByIdw(input) {
        let sumW = 0;
        let K = 0;
        let a = 0;
        let b = 0;
        let c = 0;
        let lat = 0;
        let lon = 0;
        for (const point of input.points) {
            const d = Math.max(point.distanceM, 1);
            const w = 1 / Math.pow(d, input.power);
            sumW += w;
            K += point.equation.K * w;
            a += point.equation.a * w;
            b += point.equation.b * w;
            c += point.equation.c * w;
            lat += (point.equation.latitude ?? input.latitude) * w;
            lon += (point.equation.longitude ?? input.longitude) * w;
        }
        const nearest = input.points[0].equation;
        return {
            sourceSheet: "Interpolado",
            equationId: "INTERPOLADO_IDW",
            equationVersion: nearest.equationVersion ?? "interpolated_idw_v1",
            modelo: "SHERMAN",
            modo: nearest.modo ?? "AUTO",
            metodo: `IDW p=${input.power}, n=${input.points.length}`,
            K: K / sumW,
            a: a / sumW,
            b: b / sumW,
            c: c / sumW,
            uf: input.uf,
            municipio: nearest.municipio,
            estacao: "Ponto Interpolado",
            latitude: lat / sumW,
            longitude: lon / sumW,
            referenceCode: nearest.referenceCode,
        };
    }
    async findBestMatch(input) {
        const ufValue = input.uf.toUpperCase();
        const inMunicipio = input.municipio ? this.normalizeText(input.municipio) : null;
        const inEstacao = input.estacao ? this.normalizeText(input.estacao) : null;
        const requestedMode = (input.modo ?? "AUTO").toUpperCase();
        const equations = await this.prisma.idfEquation.findMany({
            where: {
                uf: ufValue,
                status: "PUBLISHED",
            },
        });
        const ordered = [...equations].sort((a, b) => {
            const sourceCmp = this.getSourceRank(a.sourceSheet) - this.getSourceRank(b.sourceSheet);
            if (sourceCmp !== 0) {
                return sourceCmp;
            }
            const modeCmp = this.getModeRank(a.modo, requestedMode) - this.getModeRank(b.modo, requestedMode);
            if (modeCmp !== 0) {
                return modeCmp;
            }
            return (b.anosDados ?? 0) - (a.anosDados ?? 0);
        });
        if (inEstacao) {
            const byStation = ordered.find((item) => this.normalizeText(item.estacao) === inEstacao);
            if (byStation) {
                return byStation;
            }
        }
        if (inMunicipio) {
            const byMunicipio = ordered.find((item) => this.normalizeText(item.municipio) === inMunicipio);
            if (byMunicipio) {
                return byMunicipio;
            }
        }
        return ordered[0] ?? null;
    }
    pickBestEquationForMode(equations, requestedMode) {
        if (!equations.length) {
            return null;
        }
        const ordered = [...equations].sort((a, b) => {
            const sourceCmp = this.getSourceRank(a.sourceSheet) - this.getSourceRank(b.sourceSheet);
            if (sourceCmp !== 0)
                return sourceCmp;
            const modeCmp = this.getModeRank(a.modo, requestedMode) - this.getModeRank(b.modo, requestedMode);
            if (modeCmp !== 0)
                return modeCmp;
            return (b.anosDados ?? 0) - (a.anosDados ?? 0);
        });
        return ordered[0];
    }
    haversineMeters(lat1, lon1, lat2, lon2) {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    getSourceRank(sourceSheet) {
        const source = (sourceSheet ?? "").toLowerCase();
        if (source === "consolidado")
            return 0;
        if (source === "standard")
            return 1;
        if (source === "disaggregation")
            return 2;
        if (source === "interpolado")
            return 3;
        return 4;
    }
    getSourceLabel(sourceSheet) {
        const source = (sourceSheet ?? "").toLowerCase();
        if (source === "consolidado")
            return "Atualizado";
        if (source === "standard")
            return "Legado";
        if (source === "disaggregation")
            return "Desagregacao";
        if (source === "interpolado")
            return "Interpolado";
        return sourceSheet ?? "Desconhecido";
    }
    getModeRank(modeValue, requestedMode) {
        const mode = (modeValue ?? "").toUpperCase();
        if (requestedMode === "LEGADO")
            return mode === "LEGADO" ? 0 : 1;
        if (requestedMode === "MODERNO")
            return mode === "MODERNO" ? 0 : 1;
        if (mode === "MODERNO")
            return 0;
        if (mode === "LEGADO")
            return 1;
        return 2;
    }
    normalizeText(value) {
        return value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }
};
exports.IdfService = IdfService;
exports.IdfService = IdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [extended_duration_calculator_1.ExtendedDurationCalculator,
        prisma_service_1.PrismaService])
], IdfService);
//# sourceMappingURL=idf.service.js.map