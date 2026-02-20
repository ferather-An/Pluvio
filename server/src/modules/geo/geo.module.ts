import { Module } from "@nestjs/common";
import { DataModule } from "../../data/data.module";
import { GeoController } from "./geo.controller";
import { GeoService } from "./geo.service";

@Module({
  imports: [DataModule],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
