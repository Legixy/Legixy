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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckController = void 0;
const common_1 = require("@nestjs/common");
const healthCheck_1 = require("../health/healthCheck");
let HealthCheckController = class HealthCheckController {
    healthCheck;
    livenessProbe;
    readinessProbe;
    constructor(healthCheck, livenessProbe, readinessProbe) {
        this.healthCheck = healthCheck;
        this.livenessProbe = livenessProbe;
        this.readinessProbe = readinessProbe;
    }
    async getHealth() {
        return this.healthCheck.check();
    }
    async getLiveness() {
        const result = await this.livenessProbe.probe();
        if (!result.alive) {
            return { ...result, statusCode: 503 };
        }
        return result;
    }
    async getReadiness() {
        const result = await this.readinessProbe.probe();
        if (!result.ready) {
            return { ...result, statusCode: 503 };
        }
        return result;
    }
};
exports.HealthCheckController = HealthCheckController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthCheckController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthCheckController.prototype, "getLiveness", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthCheckController.prototype, "getReadiness", null);
exports.HealthCheckController = HealthCheckController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [healthCheck_1.HealthCheckService,
        healthCheck_1.LivenessProbeService,
        healthCheck_1.ReadinessProbeService])
], HealthCheckController);
//# sourceMappingURL=health.controller.js.map