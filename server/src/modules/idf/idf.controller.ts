import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CalculateIdfDto } from "./dto/calculate-idf.dto";
import { IdfService } from "./idf.service";

@Controller("idf")
export class IdfController {
  constructor(private readonly idfService: IdfService) {}

  @Post("calculate")
  calculate(@Body() body: CalculateIdfDto) {
    return this.idfService.calculate(body);
  }

  @Get("equations/:id")
  getEquationById(@Param("id") id: string) {
    return this.idfService.getEquationById(id);
  }
}
