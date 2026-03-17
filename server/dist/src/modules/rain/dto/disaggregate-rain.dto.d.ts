export declare class DisaggregateRainDto {
    chuva24hMm: number;
    duracoesMin: number[];
    metodo: "CETESB_DAEE" | "REGIONAL_SUDESTE" | "KIMBALL" | "KNOESSEN";
    fatorCorrecao?: number;
}
