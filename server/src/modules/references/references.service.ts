import { Injectable, NotFoundException } from "@nestjs/common";
import { LegacyEquationRepository } from "../../data/legacy-equation.repository";

@Injectable()
export class ReferencesService {
  constructor(private readonly repository: LegacyEquationRepository) {}

  listReferences() {
    return this.repository.listReferences();
  }

  getReferenceByCode(code: string) {
    const ref = this.repository.findReferenceByCode(code);
    if (!ref) {
      throw new NotFoundException("Referencia nao encontrada para o codigo informado.");
    }
    return ref;
  }
}
