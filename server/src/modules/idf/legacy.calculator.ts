import { Injectable } from "@nestjs/common";

@Injectable()
export class LegacyCalculator {
  calculate(K: number, a: number, b: number, c: number, duracaoMin: number, trAnos: number) {
    return K * Math.pow(trAnos, a) / Math.pow(duracaoMin + b, c);
  }
}
