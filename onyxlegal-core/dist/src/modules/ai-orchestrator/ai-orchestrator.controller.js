"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const ai_orchestrator_service_1 = require("./ai-orchestrator.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AiOrchestratorController = class AiOrchestratorController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    triggerAnalysis(user, contractId) {
        return this.aiService.triggerAnalysis(user.tenantId, contractId);
    }
    getResults(user, contractId) {
        return this.aiService.getAnalysisResults(user.tenantId, contractId);
    }
    getSuggestions(user, contractId) {
        return this.aiService.getSuggestions(user.tenantId, contractId);
    }
};
exports.AiOrchestratorController = AiOrchestratorController;
__decorate([
    (0, common_1.Post)('analyze/:contractId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiOrchestratorController.prototype, "triggerAnalysis", null);
__decorate([
    (0, common_1.Get)('analysis/:contractId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiOrchestratorController.prototype, "getResults", null);
__decorate([
    (0, common_1.Get)('suggestions/:contractId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AiOrchestratorController.prototype, "getSuggestions", null);
exports.AiOrchestratorController = AiOrchestratorController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_orchestrator_service_1.AiOrchestratorService])
], AiOrchestratorController);
//# sourceMappingURL=ai-orchestrator.controller.js.map