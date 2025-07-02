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
const boxen_1 = __importDefault(require("boxen"));
const AVAILABLE_FEATURES = ['ban', 'kick', 'warn'];
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
        // If it's a string, put it in an array, otherwise use the array as is
        selectedFeatures = Array.isArray(features) ? features : [features];
    }
    for (const feat of selectedFeatures) {
        if (!AVAILABLE_FEATURES.includes(feat)) {
            console.error((0, boxen_1.default)(`❌ Unknown feature: ${feat}`, {
                padding: { top: 0, bottom: 0, left: 1, right: 1 },
                borderStyle: 'single',
                borderColor: 'red',
            }));
            continue; // Continue with the other features instead of returning
        }
        await installFeature(feat);
    }
}
async function installFeature(name) {
    const envData = path_1.default.join(process.cwd(), 'components.json');
    let parseEnvData;
    if (!fs_1.default.existsSync(envData)) {
        console.log((0, boxen_1.default)('⚠️ components.json not found, using default configuration\n🔁 Event files will be installed to src/components', {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'yellow',
        }));
        // Detect project type by looking for .ts files
        const hasTypeScript = fs_1.default.existsSync(path_1.default.join(process.cwd(), 'tsconfig.json')) ||
            fs_1.default.existsSync(path_1.default.join(process.cwd(), 'src', 'index.ts')) ||
            fs_1.default.existsSync(path_1.default.join(process.cwd(), 'index.ts'));
        // Default configuration
        parseEnvData = {
            ts: hasTypeScript,
            aliases: {
                index: `src/index.${hasTypeScript ? 'ts' : 'js'}`,
                components: 'src/components',
                commands: 'src/commands',
            },
        };
        console.log((0, boxen_1.default)(`📋 Detected project type: ${hasTypeScript ? 'TypeScript' : 'JavaScript'}`, {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            borderStyle: 'single',
            borderColor: 'cyan',
        }));
    }
    else {
        parseEnvData = JSON.parse(fs_1.default.readFileSync(envData, 'utf-8'));
    }
    const templatePath = path_1.default.join(__dirname, '../../modules/components', name);
    const metadataPath = path_1.default.join(templatePath, 'meta.json');
    if (!fs_1.default.existsSync(templatePath)) {
        console.error(`⚠️ Feature "${name}" is not implemented yet.`);
        return;
    }
    if (!fs_1.default.existsSync(metadataPath)) {
        console.error(`⚠️ meta.json not found for feature "${name}"`);
        return;
    }
    const metadata = JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf-8'));
    const subFolder = metadata.ranking;
    const targetBasePath = process.cwd();
    // First, automatically copy all event files to components
    const eventsPath = path_1.default.join(templatePath, 'files', 'events');
    if (fs_1.default.existsSync(eventsPath)) {
        const eventFiles = fs_1.default
            .readdirSync(eventsPath)
            .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'));
        for (const eventFile of eventFiles) {
            const sourcePath = path_1.default.join(eventsPath, eventFile);
            // Use the components alias to determine the destination path
            const targetSourcePath = parseEnvData.aliases?.components || 'src/components';
            const targetPath = path_1.default.join(targetBasePath, targetSourcePath, subFolder, eventFile);
            copyFileWithAliases(sourcePath, targetPath);
        }
    }
    const commandsPath = path_1.default.join(templatePath, 'files', 'commands');
    if (fs_1.default.existsSync(commandsPath)) {
        const commandFiles = fs_1.default
            .readdirSync(commandsPath)
            .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'));
        for (const commandFile of commandFiles) {
            const sourcePath = path_1.default.join(commandsPath, commandFile);
            // Use the commands alias to determine the destination path
            const targetSourcePath = parseEnvData.aliases?.commands || 'src/commands';
            const targetPath = path_1.default.join(targetBasePath, targetSourcePath, subFolder, commandFile);
            copyFileWithAliases(sourcePath, targetPath);
        }
    }
    // Count the total number of files copied
    const eventsCount = fs_1.default.existsSync(path_1.default.join(templatePath, 'files', 'events'))
        ? fs_1.default
            .readdirSync(path_1.default.join(templatePath, 'files', 'events'))
            .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js')).length
        : 0;
    const commandsCount = fs_1.default.existsSync(path_1.default.join(templatePath, 'files', 'commands'))
        ? fs_1.default
            .readdirSync(path_1.default.join(templatePath, 'files', 'commands'))
            .filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js')).length
        : 0;
    const totalFiles = eventsCount + commandsCount;
    console.log((0, boxen_1.default)(`✅ Installed feature "${name}" (${parseEnvData.ts ? 'TypeScript' : 'JavaScript'}) - ${totalFiles} files copied`, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green',
        textAlignment: 'center',
    }));
    // Add handlers to the project index
    await addHandlersToIndex(name, parseEnvData, templatePath, subFolder);
}
async function addHandlersToIndex(featureName, parseEnvData, templatePath, subFolder) {
    const project = new ts_morph_1.Project();
    const indexAlias = parseEnvData.aliases?.index || `src/index.${parseEnvData.ts ? 'ts' : 'js'}`;
    const indexPath = path_1.default.join(process.cwd(), indexAlias);
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
    const fullComponentsPath = path_1.default.join(process.cwd(), componentsPath, subFolder);
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
    console.log((0, boxen_1.default)(`📝 Updated: ${path_1.default.relative(process.cwd(), indexPath)}`, {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'single',
        borderColor: 'blue',
    }));
}
function copyFileWithAliases(sourcePath, targetPath) {
    const targetDir = path_1.default.dirname(targetPath);
    if (!fs_1.default.existsSync(targetDir)) {
        fs_1.default.mkdirSync(targetDir, { recursive: true });
    }
    fs_1.default.copyFileSync(sourcePath, targetPath);
}
