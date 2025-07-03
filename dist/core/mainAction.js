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
const ora_1 = __importDefault(require("ora"));
const defaultProjectName = path_1.default.basename(process.cwd());
const mainAction = async (name, template, typescript, dependencies, engine) => {
    const author = 'Author: Valogzi';
    const github = 'GitHub: https://github.com/valogzi';
    const description = '🚀 Welcome to Discord Forge CLI to easily configure Discord.js bot template ';
    const message = `${description}\n\n${author}\n${github}`;
    (0, cfonts_1.say)('Discord forge', {
        font: 'block', // Use block font
        align: 'left', // Align to the left for a closer look to the image
        colors: ['system'], // Use default system colors
        background: 'transparent',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        gradient: ['#6471ff', '#2871EE'], // Gradient from blue to pink
        independentGradient: true, // Apply gradient to each letter
        transitionGradient: true, // Create a smooth transition between gradient colors
    });
    console.log((0, boxen_1.default)(message, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue',
    }) + '\n\n');
    const answers = inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            default: defaultProjectName,
            validate: input => input.length > 0 || 'The name cannot be empty.',
            when: () => !name,
        },
        {
            type: 'select',
            name: 'selectedTemplate',
            message: 'Select a template:',
            choices: [{ name: 'Default', value: 'default' }],
            default: 'default',
            when: () => !template,
        },
        {
            type: 'confirm',
            name: 'TYPESCRIPT',
            message: 'Do you want to use TypeScript?',
            default: true,
            when: () => !typescript,
        },
        {
            type: 'confirm',
            name: 'deps',
            message: 'Do you want to install dependencies?',
            default: true,
            when: () => !dependencies,
        },
        {
            type: 'confirm',
            name: 'wantAutoConfigSetup',
            message: 'Do you want to automatically configure the bot?',
            default: true,
        },
        {
            type: 'input',
            name: 'guildId',
            message: 'Enter your guild ID (or press Enter to skip):',
            when: answers => answers.wantAutoConfigSetup,
        },
        {
            type: 'input',
            name: 'clientId',
            message: 'Enter your client bot ID (or press Enter to skip):',
            when: answers => answers.wantAutoConfigSetup,
        },
        {
            type: 'password',
            name: 'token',
            message: 'Enter your bot secret token (or press Enter to skip):',
            when: answers => answers.wantAutoConfigSetup,
        },
        {
            type: 'select',
            name: 'motor',
            message: `Which engine do you want to use?`,
            when: () => !engine,
            choices: [
                { name: '📦 npm', value: 'npm' },
                { name: '🪄  pnpm', value: 'pnpm' },
                { name: '🚀 yarn', value: 'yarn' },
                { name: '🔧 bun', value: 'bun' },
            ],
        },
    ]);
    const { projectName, selectedTemplate, TYPESCRIPT, deps, motor } = await answers;
    const PROJECT_NAME = name || projectName || defaultProjectName;
    const TEMPLATE = template || selectedTemplate || 'default';
    const installDeps = dependencies || deps || true;
    const bin = engine || motor || 'npm';
    const ts = typescript || TYPESCRIPT || false;
    console.log(PROJECT_NAME, TEMPLATE, ts, installDeps, bin);
    const { guildId, clientId, token } = await answers;
    const isTs = ts ? 'ts' : 'js';
    const templatePath = path_1.default.join(__dirname, `../../templates/${TEMPLATE}/${isTs}`);
    console.log('\n');
    const templateLoader = (0, ora_1.default)('Loading template...').start();
    await new Promise(res => setTimeout(res, 1000));
    templateLoader.succeed(`Using template: ${templatePath}`);
    const targetPath = path_1.default.join(process.cwd(), PROJECT_NAME == '.' ? '' : PROJECT_NAME);
    let projectLoader = (0, ora_1.default)('Checking target directory...').start();
    if (PROJECT_NAME !== '.') {
        if (fs_1.default.existsSync(targetPath)) {
            await new Promise(res => setTimeout(res, 500));
            projectLoader.fail(`The directory ${targetPath} already exists. Please choose another name.`);
            return;
        }
        else {
            await new Promise(res => setTimeout(res, 500));
            // If the project name is not '.', use the specified directory
            projectLoader.succeed(`Using directory: ${targetPath}`);
        }
    }
    else {
        await new Promise(res => setTimeout(res, 500));
        // If the project name is '.', use the current directory
        projectLoader.succeed(`Using current directory: ${process.cwd()}.`);
    }
    // process.cwd()/<PROJECT_NAME>/config.json or process.cwd()/config.json
    const configDir = PROJECT_NAME == '.'
        ? process.cwd()
        : path_1.default.join(process.cwd(), PROJECT_NAME);
    const configPath = path_1.default.join(configDir, 'config.json');
    const configGuildId = guildId ? guildId : '';
    const configClientId = clientId ? clientId : '';
    let configToken = token ? token : '';
    projectLoader = (0, ora_1.default)('Checking Discord token...').start();
    await new Promise(res => setTimeout(res, 2000));
    const discordTokenVerification = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${configToken}` },
    });
    if (!discordTokenVerification.ok) {
        projectLoader.fail('Failed to verify the provided Discord token.');
        configToken = '';
    }
    else {
        projectLoader.succeed('Discord token verified successfully.');
    }
    const configContent = {
        guildId: configGuildId,
        clientId: configClientId,
        token: configToken,
    };
    const configContentParser = JSON.stringify(configContent, null, 2);
    projectLoader = (0, ora_1.default)('Creating config.json file...').start();
    await new Promise(res => setTimeout(res, 1000));
    if (!fs_1.default.existsSync(configDir)) {
        fs_1.default.mkdirSync(configDir, { recursive: true });
    }
    fs_1.default.writeFileSync(configPath, configContentParser, 'utf8');
    projectLoader.succeed(`Config file created at ${configPath}`);
    projectLoader = (0, ora_1.default)('Creating project files...').start();
    await new Promise(res => setTimeout(res, 1500));
    fs_1.default.cpSync(templatePath, targetPath, { recursive: true });
    projectLoader.succeed(`The "${PROJECT_NAME}" project has been successfully created!`);
    if (installDeps) {
        projectLoader = (0, ora_1.default)('Installing dependencies...').start();
        try {
            (0, child_process_1.execSync)(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
            projectLoader.succeed('Dependencies installed successfully!');
            if (ts) {
                projectLoader = (0, ora_1.default)('Setting up TypeScript environment...').start();
                await new Promise(res => setTimeout(res, 1000));
                projectLoader.succeed('TypeScript development environment ready!');
            }
        }
        catch (e) {
            projectLoader.fail(`Automatic installation failed. Run "${bin} install" manually.`);
            return;
        }
    }
    projectLoader = (0, ora_1.default)('Finalizing setup...').start();
    await new Promise(res => setTimeout(res, 1000));
    projectLoader.succeed(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`);
};
exports.default = mainAction;
