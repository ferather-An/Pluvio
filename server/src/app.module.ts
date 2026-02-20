import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { GeoModule } from "./modules/geo/geo.module";
import { IdfModule } from "./modules/idf/idf.module";
import { ReferencesModule } from "./modules/references/references.module";

@Module({
  imports: [GeoModule, IdfModule, ReferencesModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
