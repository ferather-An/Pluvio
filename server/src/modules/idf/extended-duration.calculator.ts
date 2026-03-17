import { Injectable } from "@nestjs/common";
import { LegacyCalculator } from "./legacy.calculator";

type LongDurationMethod = "KIMBALL" | "KNOESSEN";

@Injectable()
export class ExtendedDurationCalculator {
  private readonly maxLegacyDurationMin = 1440;

  constructor(private readonly legacyCalculator: LegacyCalculator) {}

  calculate(input: {
    K: number;
    a: number;
    b: number;
    c: number;
    duracaoMin: number;
    trAnos: number;
    metodo?: LongDurationMethod;
  }) {
    if (input.duracaoMin <= this.maxLegacyDurationMin) {
      return {
        intensidade: this.legacyCalculator.calculate(
          input.K,
          input.a,
          input.b,
          input.c,
          input.duracaoMin,
          input.trAnos,
        ),
        family: "SHERMAN",
        method: null,
        anchorDurationMin: input.duracaoMin,
      };
    }

    const method = input.metodo ?? "KIMBALL";
    const exponent = method === "KNOESSEN" ? 0.3054 : 0.305;

    const intensidade24h = this.legacyCalculator.calculate(
      input.K,
      input.a,
      input.b,
      input.c,
      this.maxLegacyDurationMin,
      input.trAnos,
    );

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
}
