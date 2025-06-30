#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const program = new commander_1.Command();
const defaultProjectName = path_1.default.basename(process.cwd());
program
    .name('create-discord-forge')
    .description('A CLI tool for creating Discord bots whith operational templates.')
    .version('0.1.0')
    .action(async () => {
    const answers = inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'PROJECT_NAME',
            message: 'Project name:',
            default: defaultProjectName,
            validate: input => input.length > 0 || 'Le nom ne peut pas être vide.',
        },
        {
            type: 'select',
            name: 'TEMPLATE',
            message: 'Select a template:',
            choices: [
                { name: '🔵 TypeScript', value: 'ts' },
                { name: '🟡 JavaScript', value: 'js' },
            ],
        },
        {
            type: 'confirm',
            name: 'installDeps',
            message: 'Did you want to install dependencies?',
            default: true,
        },
        {
            type: 'select',
            name: 'bin',
            message: `Which engine do you want to use?`,
            choices: [
                { name: '📦 npm', value: 'npm' },
                { name: '🪄  pnpm', value: 'pnpm' },
            ],
        },
    ]);
    const { PROJECT_NAME, TEMPLATE, installDeps, bin } = await answers;
    const templatePath = path_1.default.join(__dirname, `../templates/${TEMPLATE}`);
    console.log(`📂 Using template: ${templatePath}`);
    const targetPath = path_1.default.join(process.cwd(), PROJECT_NAME);
    if (fs_1.default.existsSync(targetPath) && targetPath !== '.') {
        console.error(`❌ Le dossier "${PROJECT_NAME}" existe déjà.`);
        process.exit(1);
    }
    fs_1.default.cpSync(templatePath, targetPath, { recursive: true });
    console.log(`✅ The "${PROJECT_NAME}" project has been successfully created !`);
    if (installDeps) {
        try {
            console.log('-----------------------------------------------');
            (0, child_process_1.execSync)(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
            console.log('-----------------------------------------------');
            if (TEMPLATE === 'ts')
                console.log('🔧 Installed developpement TypeScript dependencies...');
            console.log('📦 Installed dependencies.');
            (0, child_process_1.execSync)(`cd ${PROJECT_NAME}`);
        }
        catch (e) {
            console.log(`⚠️ Automatic installation failed. Run "${bin} install" manually.`);
        }
    }
    console.log(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`);
});
program.parse();
