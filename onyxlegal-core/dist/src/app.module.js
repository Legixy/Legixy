"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_pino_1 = require("nestjs-pino");
const database_module_1 = require("./database/database.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const jwt_auth_guard_1 = require("./modules/auth/jwt-auth.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const contracts_module_1 = require("./modules/contracts/contracts.module");
const templates_module_1 = require("./modules/templates/templates.module");
const ai_orchestrator_module_1 = require("./modules/ai-orchestrator/ai-orchestrator.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const bullModuleImport = bullmq_1.BullModule.forRootAsync({
    imports: [config_1.ConfigModule],
    inject: [config_1.ConfigService],
    useFactory: (config) => ({
        connection: {
            url: config.get('REDIS_URL', 'redis://localhost:6379'),
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3)
                    return null;
                return Math.min(times * 500, 3000);
            },
        },
    }),
});
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    transport: {
                        target: 'pino-pretty',
                        options: { singleLine: true, colorize: true },
                    },
                },
            }),
            bullModuleImport,
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            contracts_module_1.ContractsModule,
            templates_module_1.TemplatesModule,
            ai_orchestrator_module_1.AiOrchestratorModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map