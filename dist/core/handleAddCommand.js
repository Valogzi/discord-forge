"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAddCommand = handleAddCommand;
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ts_morph_1 = require("ts-morph");
const AVAILABLE_FEATURES = ['ban', 'kick'];
async function handleAddCommand(features) {
    let selectedFeatures = [];
    if (!features || (Array.isArray(features) && features.length === 0)) {
        const { chosen } = await inquirer_1.default.prompt([
            {
                name: 'chosen',
                type: 'checkbox',
                message: 'Which features do you want to add?',
                choices: AVAILABLE_FEATURES,
            },
        ]);
        selectedFeatures = chosen;
    }
    else {
        // Si c'est un string, le mettre dans un array, sinon utiliser l'array tel quel
        selectedFeatures = Array.isArray(features) ? features : [features];
    }
    for (const feat of selectedFeatures) {
        if (!AVAILABLE_FEATURES.includes(feat)) {
            console.error(`❌ Unknown feature: ${feat}`);
            continue; // Continue avec les autres features au lieu de return
        }
        await installFeature(feat);
    }
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
    // Ajouter les handlers dans l'index du projet
    await addHandlersToIndex(name, parseEnvData, templatePath);
}
async function addHandlersToIndex(featureName, parseEnvData, templatePath) {
    const project = new ts_morph_1.Project();
    const indexPath = parseEnvData.ts
        ? path_1.default.join(process.cwd(), 'src', 'index.ts')
        : path_1.default.join(process.cwd(), 'src', 'index.js');
    if (!fs_1.default.existsSync(indexPath)) {
        console.warn(`⚠️ Index file not found: ${indexPath}`);
        return;
    }
    // Charger le fichier index
    const sourceFile = project.addSourceFileAtPath(indexPath);
    // Trouver les fichiers events à importer
    const eventsPath = path_1.default.join(templatePath, 'files', 'events');
    if (!fs_1.default.existsSync(eventsPath)) {
        return;
    }
    const eventFiles = fs_1.default
        .readdirSync(eventsPath)
        .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'))
        .map(file => path_1.default.basename(file, path_1.default.extname(file)));
    // Ajouter les imports
    const componentsPath = parseEnvData.aliases?.components || 'src/components';
    const fullComponentsPath = path_1.default.join(process.cwd(), componentsPath);
    let relativeComponentsPath = path_1.default
        .relative(path_1.default.dirname(indexPath), fullComponentsPath)
        .replace(/\\/g, '/');
    // S'assurer que le chemin relatif commence par ./ ou ../
    if (!relativeComponentsPath.startsWith('.')) {
        relativeComponentsPath = './' + relativeComponentsPath;
    }
    for (const eventFile of eventFiles) {
        // Vérifier si l'import existe déjà
        const existingImport = sourceFile
            .getImportDeclarations()
            .find(imp => imp.getModuleSpecifierValue().includes(eventFile));
        if (!existingImport) {
            if (parseEnvData.ts) {
                // TypeScript: import destructuré
                const namedImports = eventFile.includes('Handler')
                    ? [eventFile, `handle${eventFile.replace('CommandHandler', '')}Modal`]
                    : [eventFile];
                sourceFile.addImportDeclaration({
                    moduleSpecifier: `${relativeComponentsPath}/${eventFile}`,
                    namedImports: namedImports,
                });
            }
            else {
                // JavaScript: require destructuré
                const namedImports = eventFile.includes('Handler')
                    ? [eventFile, `handle${eventFile.replace('CommandHandler', '')}Modal`]
                    : [eventFile];
                sourceFile.addStatements(`const { ${namedImports.join(', ')} } = require('${relativeComponentsPath}/${eventFile}');`);
            }
        }
    }
    // Trouver où ajouter les appels de handlers (avant client.login)
    const clientLogin = sourceFile
        .getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
        .find(call => {
        const expression = call.getExpression();
        return (expression.getKind() === ts_morph_1.SyntaxKind.PropertyAccessExpression &&
            expression.getText().includes('client.login'));
    });
    if (clientLogin) {
        const statement = clientLogin.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ExpressionStatement);
        if (statement) {
            // Ajouter les appels de handlers avant client.login()
            const statementsToAdd = [];
            for (const eventFile of eventFiles) {
                const handlerCall = `${eventFile}(client);`;
                const modalHandlerCall = eventFile.includes('Handler')
                    ? `handle${eventFile.replace('CommandHandler', '')}Modal(client);`
                    : null;
                // Vérifier si l'appel existe déjà
                const existingCall = sourceFile.getFullText().includes(handlerCall);
                if (!existingCall) {
                    statementsToAdd.push(handlerCall);
                    if (modalHandlerCall) {
                        statementsToAdd.push(modalHandlerCall);
                    }
                }
            }
            // Insérer les statements avant client.login()
            if (statementsToAdd.length > 0) {
                const statementIndex = sourceFile.getStatements().indexOf(statement);
                sourceFile.insertStatements(statementIndex, statementsToAdd);
            }
        }
    }
    // Sauvegarder les modifications
    await sourceFile.save();
    console.log(`📝 Updated: ${path_1.default.relative(process.cwd(), indexPath)}`);
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
