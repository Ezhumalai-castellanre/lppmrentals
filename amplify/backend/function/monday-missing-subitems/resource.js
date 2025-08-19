"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mondayMissingSubitemsFunction = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.mondayMissingSubitemsFunction = (0, backend_1.defineFunction)({
    name: "monday-missing-subitems",
    entry: "./handler.ts"
});
