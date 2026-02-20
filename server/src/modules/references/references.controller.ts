import { Controller, Get, Param } from "@nestjs/common";
import { ReferencesService } from "./references.service";

@Controller("references")
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Get()
  listReferences() {
    return this.referencesService.listReferences();
  }

  @Get(":code")
  getReferenceByCode(@Param("code") code: string) {
    return this.referencesService.getReferenceByCode(code);
  }
}
