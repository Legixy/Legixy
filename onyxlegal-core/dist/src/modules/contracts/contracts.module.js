"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const contracts_controller_1 = require("./contracts.controller");
const contracts_service_1 = require("./contracts.service");
const contractActionPanel_controller_1 = require("../../features/contracts/controllers/contractActionPanel.controller");
const riskFormatter_service_1 = require("../../features/contracts/services/riskFormatter.service");
const contractFix_service_1 = require("../../features/contracts/services/contractFix.service");
const contractHistory_service_1 = require("../../features/contracts/services/contractHistory.service");
let ContractsModule = class ContractsModule {
};
exports.ContractsModule = ContractsModule;
exports.ContractsModule = ContractsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.register({
                limits: { fileSize: 10 * 1024 * 1024 },
            }),
        ],
        controllers: [contracts_controller_1.ContractsController, contractActionPanel_controller_1.ContractActionPanelController],
        providers: [
            contracts_service_1.ContractsService,
            riskFormatter_service_1.RiskFormatterService,
            contractFix_service_1.ContractFixService,
            contractHistory_service_1.ContractHistoryService,
        ],
        exports: [contracts_service_1.ContractsService],
    })
], ContractsModule);
//# sourceMappingURL=contracts.module.js.map