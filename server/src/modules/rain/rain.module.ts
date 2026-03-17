import { Module } from "@nestjs/common";
import { RainController } from "./rain.controller";
import { RainService } from "./rain.service";

@Module({
  controllers: [RainController],
  providers: [RainService],
})
export class RainModule {}
