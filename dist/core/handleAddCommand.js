"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAddCommand = handleAddCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const AVAILABLE_FEATURES = ['ban'];
async function handleAddCommand(feature) {
    let selectedFeature = feature;
    if (!feature) {
        const { chosen } = await inquirer_1.default.prompt([
            {
                name: 'chosen',
                type: 'checkbox',
                message: 'Which features do you want to add?',
                choices: AVAILABLE_FEATURES,
            },
        ]);
        for (const feat of chosen) {
            await installFeature(feat);
        }
        return;
    }
    if (!AVAILABLE_FEATURES.includes(selectedFeature)) {
        console.error(`❌ Unknown feature: ${selectedFeature}`);
        return;
    }
    await installFeature(selectedFeature);
}
async function installFeature(name) {
    const envData = path_1.default.join(process.cwd(), 'components.json');
    if (!fs_1.default.existsSync(envData)) {
        console.error(`❌ components.json not found in current directory`);
        return;
    }
    const parseEnvData = JSON.parse(fs_1.default.readFileSync(envData, 'utf-8'));
    const templatePath = path_1.default.join(__dirname, '../../modules/components', name);
    const metadataPath = path_1.default.join(templatePath, 'meta.json');
    const injectdataPath = path_1.default.join(templatePath, 'inject.json');
    if (!fs_1.default.existsSync(templatePath)) {
        console.error(`⚠️ Feature "${name}" is not implemented yet.`);
        return;
    }
    if (!fs_1.default.existsSync(injectdataPath)) {
        console.error(`⚠️ inject.json not found for feature "${name}"`);
        return;
    }
    const injectData = JSON.parse(fs_1.default.readFileSync(injectdataPath, 'utf-8'));
    const projectType = parseEnvData.ts ? 'ts' : 'js';
    if (!injectData[projectType] || !injectData[projectType].copy) {
        console.error(`⚠️ No configuration found for ${projectType} in inject.json`);
        return;
    }
    // Copier les fichiers selon les règles d'injection
    const copyRules = injectData[projectType].copy;
    const sourceBasePath = templatePath;
    const targetBasePath = process.cwd();
    // D'abord, copier automatiquement tous les fichiers events vers components
    const eventsPath = path_1.default.join(templatePath, 'files', 'events');
    if (fs_1.default.existsSync(eventsPath)) {
        const eventFiles = fs_1.default
            .readdirSync(eventsPath)
            .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'));
        for (const eventFile of eventFiles) {
            const sourcePath = path_1.default.join(eventsPath, eventFile);
            // Utiliser l'alias components pour déterminer le chemin de destination
            const componentsPath = parseEnvData.aliases?.components || 'src/components';
            const targetPath = path_1.default.join(targetBasePath, componentsPath, eventFile);
            copyFileWithAliases(sourcePath, targetPath);
        }
    }
    // Ensuite, copier les fichiers selon les règles explicites d'inject.json
    for (const rule of copyRules) {
        const sourcePath = path_1.default.join(sourceBasePath, rule.from);
        const targetPath = path_1.default.join(targetBasePath, rule.to);
        if (!fs_1.default.existsSync(sourcePath)) {
            console.warn(`⚠️ Source file not found: ${rule.from}`);
            continue;
        }
        copyFileWithAliases(sourcePath, targetPath);
    }
    // Compter le total de fichiers copiés
    const eventsCount = fs_1.default.existsSync(path_1.default.join(templatePath, 'files', 'events'))
        ? fs_1.default
            .readdirSync(path_1.default.join(templatePath, 'files', 'events'))
            .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js')).length
        : 0;
    const totalFiles = copyRules.length + eventsCount;
    console.log(`✅ Installed feature "${name}" (${parseEnvData.ts ? 'TypeScript' : 'JavaScript'}) - ${totalFiles} files copied`);
}
function copyFileWithAliases(sourcePath, targetPath) {
    // Créer le dossier parent si nécessaire
    const targetDir = path_1.default.dirname(targetPath);
    fs_1.default.mkdirSync(targetDir, { recursive: true });
    // Lire le contenu du fichier source
    const fileContent = fs_1.default.readFileSync(sourcePath, 'utf-8');
    // Écrire le fichier (sans modification d'alias dans le contenu)
    fs_1.default.writeFileSync(targetPath, fileContent, 'utf-8');
    console.log(`📁 Copied: ${path_1.default.relative(process.cwd(), targetPath)}`);
}
