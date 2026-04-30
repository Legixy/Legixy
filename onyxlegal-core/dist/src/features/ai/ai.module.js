"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const aiEngine_1 = require("./services/aiEngine");
const analysis_gateway_1 = require("./websocket/analysis.gateway");
const worker_service_1 = require("./workers/worker.service");
let AIModule = class AIModule {
};
exports.AIModule = AIModule;
exports.AIModule = AIModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({ name: 'contract-analysis' }),
            bullmq_1.BullModule.registerQueue({ name: 'clause-fix' }),
            bullmq_1.BullModule.registerQueue({ name: 'contract-analysis-dlq' }),
        ],
        providers: [aiEngine_1.AIEngine, analysis_gateway_1.AIAnalysisGateway, worker_service_1.WorkerService],
        exports: [aiEngine_1.AIEngine, analysis_gateway_1.AIAnalysisGateway],
    })
], AIModule);
//# sourceMappingURL=ai.module.js.map