import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ReferencesService } from "./references.service";

@ApiTags("references")
@Controller("references")
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Get()
  @ApiOperation({ summary: "Listar fontes de dados e referências bibliográficas" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "q", required: false, description: "Busca textual" })
  listReferences(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
  ) {
    const pageNum = Math.max(1, Number(page ?? 1) || 1);
    const sizeNum = Math.min(100, Math.max(1, Number(pageSize ?? 10) || 10));

    return this.referencesService.listReferences({
      page: pageNum,
      pageSize: sizeNum,
      q,
    });
  }

  @Get(":code")
  @ApiOperation({ summary: "Detalhes de uma referência pelo código" })
  getReferenceByCode(@Param("code") code: string) {
    return this.referencesService.getReferenceByCode(code);
  }
}
