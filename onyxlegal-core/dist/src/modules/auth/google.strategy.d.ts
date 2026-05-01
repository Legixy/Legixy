import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
export interface GoogleProfile {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}
declare const GoogleStrategy_base: new (...args: [options: import("passport-google-oauth20").StrategyOptionsWithRequest] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptions] | [options: import("passport-google-oauth20").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GoogleStrategy extends GoogleStrategy_base {
    private readonly config;
    constructor(config: ConfigService);
    validate(_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: GoogleProfile) => void): void;
}
export {};
