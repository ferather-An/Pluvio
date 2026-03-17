import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth("jwt")
@UseGuards(JwtAuthGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  @ApiOperation({ summary: "Estatísticas gerais do banco de dados" })
  getStats() {
    return this.adminService.getStats();
  }

  @Get("datasets")
  @ApiOperation({ summary: "Listar datasets com contagem de equações" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  listDatasets(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.adminService.listDatasets(Number(page ?? 1), Number(pageSize ?? 20));
  }

  @Get("datasets/:id")
  @ApiOperation({ summary: "Detalhes de um dataset (primeiras 50 equações)" })
  getDataset(@Param("id") id: string) {
    return this.adminService.getDataset(id);
  }

  @Post("datasets/:id/publish")
  @ApiOperation({ summary: "Publicar dataset (STAGING → PUBLISHED)" })
  publishDataset(@Param("id") id: string, @Req() req: any) {
    return this.adminService.publishDataset(id, req.user?.email ?? "system");
  }

  @Post("datasets/:id/deprecate")
  @ApiOperation({ summary: "Deprecar dataset (PUBLISHED → DEPRECATED)" })
  deprecateDataset(@Param("id") id: string, @Req() req: any) {
    return this.adminService.deprecateDataset(id, req.user?.email ?? "system");
  }

  @Post("import/xlsx")
  @ApiOperation({ summary: "Importar equações IDF de planilha XLSX" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  importXlsx(
    @UploadedFile() file: Express.Multer.File,
    @Body("nomeDataset") nomeDataset: string,
    @Req() req: any,
  ) {
    if (!file) throw new Error("Arquivo não enviado");
    return this.adminService.importXlsx(
      file.buffer,
      nomeDataset ?? "Importação Manual",
      req.user?.email ?? "system",
    );
  }

  @Get("audit")
  @ApiOperation({ summary: "Log de auditoria de ações administrativas" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  listAuditLog(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.adminService.listAuditLog(Number(page ?? 1), Number(pageSize ?? 50));
  }
}
