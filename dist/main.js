#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const mainAction_1 = __importDefault(require("./core/mainAction"));
const handleAddCommand_1 = require("./core/handleAddCommand");
const program = new commander_1.Command();
program
    .name('create-discord-forge')
    .description('A CLI tool for creating Discord bots whith operational templates.')
    .version('0.1.0')
    .action(mainAction_1.default);
program
    .command('add')
    .description('Add a new feature to your bot')
    .argument('[feature]', 'Feature to add')
    .action(feature => {
    (0, handleAddCommand_1.handleAddCommand)(feature);
});
program.parse();
