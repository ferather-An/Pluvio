import { Module } from "@nestjs/common";
import { DataModule } from "../../data/data.module";
import { ReferencesController } from "./references.controller";
import { ReferencesService } from "./references.service";

@Module({
  imports: [DataModule],
  controllers: [ReferencesController],
  providers: [ReferencesService],
})
export class ReferencesModule {}
