import { Module } from "@nestjs/common";
import { LegacyEquationRepository } from "./legacy-equation.repository";

@Module({
  providers: [LegacyEquationRepository],
  exports: [LegacyEquationRepository],
})
export class DataModule {}
