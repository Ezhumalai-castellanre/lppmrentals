"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookProxyFunction = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.webhookProxyFunction = (0, backend_1.defineFunction)({
    name: "webhook-proxy-function",
    entry: "./handler.ts"
});
