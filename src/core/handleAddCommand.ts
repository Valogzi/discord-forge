import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';

const AVAILABLE_FEATURES = ['ban'];

export async function handleAddCommand(feature?: string) {
	let selectedFeature = feature!;

	if (!feature) {
		const { chosen } = await inquirer.prompt([
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

async function installFeature(name: string) {
	const envData = path.join(process.cwd(), 'components.json');

	if (!fs.existsSync(envData)) {
		console.error(`❌ components.json not found in current directory`);
		return;
	}

	const parseEnvData: {
		ts: boolean;
		aliases: Record<string, string>;
	} = JSON.parse(fs.readFileSync(envData, 'utf-8'));

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
	const sourceBasePath = templatePath;
	const targetBasePath = process.cwd();

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
			const targetPath = path.join(targetBasePath, componentsPath, eventFile);

			copyFileWithAliases(sourcePath, targetPath);
		}
	}

	// Ensuite, copier les fichiers selon les règles explicites d'inject.json
	for (const rule of copyRules) {
		const sourcePath = path.join(sourceBasePath, rule.from);
		const targetPath = path.join(targetBasePath, rule.to);

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

	// Ajouter les handlers dans l'index du projet
	await addHandlersToIndex(name, parseEnvData, templatePath);

	console.log(
		`✅ Installed feature "${name}" (${
			parseEnvData.ts ? 'TypeScript' : 'JavaScript'
		}) - ${totalFiles} files copied`,
	);

	await addHandlersToIndex(name, parseEnvData, templatePath);
}

async function addHandlersToIndex(
	featureName: string,
	parseEnvData: { ts: boolean; aliases: Record<string, string> },
	templatePath: string,
) {
	const project = new Project();
	const indexPath = parseEnvData.ts
		? path.join(process.cwd(), 'src', 'index.ts')
		: path.join(process.cwd(), 'src', 'index.js');

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
