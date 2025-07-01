import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';

const AVAILABLE_FEATURES = ['ban', 'kick'];

export async function handleAddCommand(features?: string | string[]) {
	let selectedFeatures: string[] = [];

	if (!features || (Array.isArray(features) && features.length === 0)) {
		const { chosen } = await inquirer.prompt([
			{
				name: 'chosen',
				type: 'checkbox',
				message: 'Which features do you want to add?',
				choices: AVAILABLE_FEATURES,
			},
		]);
		selectedFeatures = chosen;
	} else {
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

async function installFeature(name: string) {
	const envData = path.join(process.cwd(), 'components.json');

	let parseEnvData: {
		ts: boolean;
		aliases: Record<string, string>;
	};

	if (!fs.existsSync(envData)) {
		console.log('⚠️ components.json not found, using default configuration');
		console.log('🔁 Event files will be installed to src/components');

		// Détecter le type de projet en cherchant des fichiers .ts
		const hasTypeScript =
			fs.existsSync(path.join(process.cwd(), 'tsconfig.json')) ||
			fs.existsSync(path.join(process.cwd(), 'src', 'index.ts')) ||
			fs.existsSync(path.join(process.cwd(), 'index.ts'));

		// Configuration par défaut
		parseEnvData = {
			ts: hasTypeScript,
			aliases: {
				index: `src/index.${hasTypeScript ? 'ts' : 'js'}`,
				components: 'src/components',
				commands: 'src/commands',
			},
		};

		console.log(
			`📋 Detected project type: ${
				hasTypeScript ? 'TypeScript' : 'JavaScript'
			}`,
		);
	} else {
		parseEnvData = JSON.parse(fs.readFileSync(envData, 'utf-8'));
	}

	const templatePath = path.join(__dirname, '../../modules/components', name);
	const metadataPath = path.join(templatePath, 'meta.json');
	const injectdataPath = path.join(templatePath, 'inject.json');

	if (!fs.existsSync(templatePath)) {
		console.error(`⚠️ Feature "${name}" is not implemented yet.`);
		return;
	}

	if (!fs.existsSync(injectdataPath)) {
		console.error(`⚠️ inject.json not found for feature "${name}"`);
		return;
	}

	const injectData = JSON.parse(fs.readFileSync(injectdataPath, 'utf-8'));
	const projectType = parseEnvData.ts ? 'ts' : 'js';

	if (!injectData[projectType] || !injectData[projectType].copy) {
		console.error(
			`⚠️ No configuration found for ${projectType} in inject.json`,
		);
		return;
	}

	// Copier les fichiers selon les règles d'injection
	const copyRules = injectData[projectType].copy;
	const targetBasePath = process.cwd();

	const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
	const subFolder = metadata.ranking;

	// D'abord, copier automatiquement tous les fichiers events vers components
	const eventsPath = path.join(templatePath, 'files', 'events');
	if (fs.existsSync(eventsPath)) {
		const eventFiles = fs
			.readdirSync(eventsPath)
			.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'));

		for (const eventFile of eventFiles) {
			const sourcePath = path.join(eventsPath, eventFile);

			// Utiliser l'alias components pour déterminer le chemin de destination
			const componentsPath =
				parseEnvData.aliases?.components || 'src/components';

			const targetPath = path.join(
				targetBasePath,
				componentsPath,
				subFolder,
				eventFile,
			);

			copyFileWithAliases(sourcePath, targetPath);
		}
	}

	// Ensuite, copier les fichiers selon les règles explicites d'inject.json
	for (const rule of copyRules) {
		const sourcePath = path.join(templatePath, rule.from);
		const targetSourcePath = parseEnvData.aliases?.commands || 'src/commands';
		const targetPath = path.join(
			targetBasePath,
			targetSourcePath,
			subFolder,
			rule.to,
		);

		if (!fs.existsSync(sourcePath)) {
			console.warn(`⚠️ Source file not found: ${rule.from}`);
			continue;
		}

		copyFileWithAliases(sourcePath, targetPath);
	}

	// Compter le total de fichiers copiés
	const eventsCount = fs.existsSync(path.join(templatePath, 'files', 'events'))
		? fs
				.readdirSync(path.join(templatePath, 'files', 'events'))
				.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js')).length
		: 0;
	const totalFiles = copyRules.length + eventsCount;

	console.log(
		`✅ Installed feature "${name}" (${
			parseEnvData.ts ? 'TypeScript' : 'JavaScript'
		}) - ${totalFiles} files copied`,
	);

	// Ajouter les handlers dans l'index du projet
	await addHandlersToIndex(name, parseEnvData, templatePath);
}

async function addHandlersToIndex(
	featureName: string,
	parseEnvData: { ts: boolean; aliases: Record<string, string> },
	templatePath: string,
) {
	const project = new Project();
	const indexAlias =
		parseEnvData.aliases?.index || `src/index.${parseEnvData.ts ? 'ts' : 'js'}`;
	const indexPath = path.join(process.cwd(), indexAlias);

	if (!fs.existsSync(indexPath)) {
		console.warn(`⚠️ Index file not found: ${indexPath}`);
		return;
	}

	// Charger le fichier index
	const sourceFile = project.addSourceFileAtPath(indexPath);

	// Trouver les fichiers events à importer
	const eventsPath = path.join(templatePath, 'files', 'events');
	if (!fs.existsSync(eventsPath)) {
		return;
	}

	const eventFiles = fs
		.readdirSync(eventsPath)
		.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'))
		.map(file => path.basename(file, path.extname(file)));

	// Ajouter les imports
	const componentsPath = parseEnvData.aliases?.components || 'src/components';
	const fullComponentsPath = path.join(process.cwd(), componentsPath);
	let relativeComponentsPath = path
		.relative(path.dirname(indexPath), fullComponentsPath)
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
			} else {
				// JavaScript: require destructuré
				const namedImports = eventFile.includes('Handler')
					? [eventFile, `handle${eventFile.replace('CommandHandler', '')}Modal`]
					: [eventFile];

				sourceFile.addStatements(
					`const { ${namedImports.join(
						', ',
					)} } = require('${relativeComponentsPath}/${eventFile}');`,
				);
			}
		}
	}

	// Trouver où ajouter les appels de handlers (avant client.login)
	const clientLogin = sourceFile
		.getDescendantsOfKind(SyntaxKind.CallExpression)
		.find(call => {
			const expression = call.getExpression();
			return (
				expression.getKind() === SyntaxKind.PropertyAccessExpression &&
				expression.getText().includes('client.login')
			);
		});

	if (clientLogin) {
		const statement = clientLogin.getFirstAncestorByKind(
			SyntaxKind.ExpressionStatement,
		);
		if (statement) {
			// Ajouter les appels de handlers avant client.login()
			const statementsToAdd: string[] = [];

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
	console.log(`📝 Updated: ${path.relative(process.cwd(), indexPath)}`);
}

function copyFileWithAliases(sourcePath: string, targetPath: string) {
	// Créer le dossier parent si nécessaire
	const targetDir = path.dirname(targetPath);
	fs.mkdirSync(targetDir, { recursive: true });

	// Lire le contenu du fichier source
	const fileContent = fs.readFileSync(sourcePath, 'utf-8');

	// Écrire le fichier (sans modification d'alias dans le contenu)
	fs.writeFileSync(targetPath, fileContent, 'utf-8');
	console.log(`📁 Copied: ${path.relative(process.cwd(), targetPath)}`);
}
