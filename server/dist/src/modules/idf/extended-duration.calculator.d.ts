import { LegacyCalculator } from "./legacy.calculator";
type LongDurationMethod = "KIMBALL" | "KNOESSEN";
export declare class ExtendedDurationCalculator {
    private readonly legacyCalculator;
    private readonly maxLegacyDurationMin;
    constructor(legacyCalculator: LegacyCalculator);
    calculate(input: {
        K: number;
        a: number;
        b: number;
        c: number;
        duracaoMin: number;
        trAnos: number;
        metodo?: LongDurationMethod;
    }): {
        intensidade: number;
        family: string;
        method: null;
        anchorDurationMin: number;
    } | {
        intensidade: number;
        family: string;
        method: LongDurationMethod;
        anchorDurationMin: number;
    };
}
export {};
