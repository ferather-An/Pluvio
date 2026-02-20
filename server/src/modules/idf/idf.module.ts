import { Module } from "@nestjs/common";
import { DataModule } from "../../data/data.module";
import { IdfController } from "./idf.controller";
import { IdfService } from "./idf.service";
import { LegacyCalculator } from "./legacy.calculator";

@Module({
  imports: [DataModule],
  controllers: [IdfController],
  providers: [IdfService, LegacyCalculator],
})
export class IdfModule {}
