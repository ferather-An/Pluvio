"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdfModule = void 0;
const common_1 = require("@nestjs/common");
const data_module_1 = require("../../data/data.module");
const extended_duration_calculator_1 = require("./extended-duration.calculator");
const idf_controller_1 = require("./idf.controller");
const idf_service_1 = require("./idf.service");
const legacy_calculator_1 = require("./legacy.calculator");
let IdfModule = class IdfModule {
};
exports.IdfModule = IdfModule;
exports.IdfModule = IdfModule = __decorate([
    (0, common_1.Module)({
        imports: [data_module_1.DataModule],
        controllers: [idf_controller_1.IdfController],
        providers: [idf_service_1.IdfService, legacy_calculator_1.LegacyCalculator, extended_duration_calculator_1.ExtendedDurationCalculator],
    })
], IdfModule);
//# sourceMappingURL=idf.module.js.map