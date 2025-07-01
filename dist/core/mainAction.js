"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const cfonts_1 = require("cfonts");
const boxen_1 = __importDefault(require("boxen"));
const defaultProjectName = path_1.default.basename(process.cwd());
const mainAction = async () => {
    const author = 'Author: Valogzi';
    const github = 'GitHub: https://github.com/valogzi';
    const description = '🚀 Welcome to Discord Forge CLI to easily configure Discordjs bot template ';
    const message = `${description}\n\n${author}\n${github}`;
    (0, cfonts_1.say)('Discord forge', {
        font: 'block', // Utilise la police en blocs
        align: 'left', // Alignement à gauche pour un look plus proche de l'image
        colors: ['system'], // Utilise les couleurs du système par défaut
        background: 'transparent',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        gradient: ['#6471ff', '#2871EE'], // Dégradé de bleu à rose
        independentGradient: true, // Applique le dégradé sur chaque lettre
        transitionGradient: true, // Crée une transition douce entre les couleurs du dégradé
    });
    console.log((0, boxen_1.default)(message, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue',
    }) + '\n\n');
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
    console.log((0, boxen_1.default)(`📂 Using template: ${templatePath}`, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
    const targetPath = path_1.default.join(process.cwd(), PROJECT_NAME == '.' ? '' : PROJECT_NAME);
    if (PROJECT_NAME !== '.') {
        if (fs_1.default.existsSync(targetPath)) {
            console.error((0, boxen_1.default)(`❌ The folder "${PROJECT_NAME}" already exist.`, {
                padding: 1,
                borderStyle: 'double',
                borderColor: 'red',
            }));
            process.exit(1);
        }
    }
    fs_1.default.cpSync(templatePath, targetPath, { recursive: true });
    console.log((0, boxen_1.default)(`✅ The "${PROJECT_NAME}" project has been successfully created !`, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green',
        textAlignment: 'center',
    }));
    if (installDeps) {
        try {
            console.log((0, boxen_1.default)('🔄 Installing dependencies...', {
                padding: { top: 0, bottom: 0, left: 2, right: 2 },
                borderStyle: 'single',
                borderColor: 'yellow',
                textAlignment: 'center',
            }));
            (0, child_process_1.execSync)(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
            console.log((0, boxen_1.default)('📦 Dependencies installed successfully!', {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'green',
            }));
            if (TYPESCRIPT) {
                console.log((0, boxen_1.default)('🔧 TypeScript development environment ready!', {
                    padding: { top: 0, bottom: 0, left: 1, right: 1 },
                    borderStyle: 'single',
                    borderColor: 'blue',
                }));
            }
        }
        catch (e) {
            console.log((0, boxen_1.default)(`⚠️ Automatic installation failed. Run "${bin} install" manually.`, {
                padding: 1,
                borderStyle: 'double',
                borderColor: 'yellow',
            }));
        }
    }
    console.log((0, boxen_1.default)(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`, {
        padding: 1,
        borderStyle: 'double',
        borderColor: 'magenta',
        textAlignment: 'center',
        title: '🎉 SUCCESS',
        titleAlignment: 'center',
    }));
};
exports.default = mainAction;
