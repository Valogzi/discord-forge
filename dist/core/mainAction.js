"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const defaultProjectName = path_1.default.basename(process.cwd());
const mainAction = async () => {
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
            choices: [{ name: 'Default', value: 'default' }],
        },
        {
            type: 'confirm',
            name: 'TYPESCRIPT',
            message: 'Do you want to use TypeScript?',
            default: true,
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
                { name: '🚀 yarn', value: 'yarn' },
                { name: '🔧 bun', value: 'bun' },
            ],
        },
    ]);
    const { PROJECT_NAME, TEMPLATE, TYPESCRIPT, installDeps, bin } = await answers;
    const isTs = TYPESCRIPT ? 'ts' : 'js';
    const templatePath = path_1.default.join(__dirname, `../../templates/${TEMPLATE}/${isTs}`);
    console.log(`📂 Using template: ${templatePath}`);
    const targetPath = path_1.default.join(process.cwd(), PROJECT_NAME == '.' ? '' : PROJECT_NAME);
    if (PROJECT_NAME !== '.') {
        if (fs_1.default.existsSync(targetPath)) {
            console.error(`❌ The folder "${PROJECT_NAME}" already exist.`);
            process.exit(1);
        }
    }
    fs_1.default.cpSync(templatePath, targetPath, { recursive: true });
    console.log(`✅ The "${PROJECT_NAME}" project has been successfully created !`);
    if (installDeps) {
        try {
            console.log('-----------------------------------------------');
            (0, child_process_1.execSync)(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
            console.log('-----------------------------------------------');
            if (TYPESCRIPT)
                console.log('🔧 Installed developpement TypeScript dependencies...');
            console.log('📦 Installed dependencies.');
        }
        catch (e) {
            console.log(`⚠️ Automatic installation failed. Run "${bin} install" manually.`);
        }
    }
    console.log(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`);
};
exports.default = mainAction;
