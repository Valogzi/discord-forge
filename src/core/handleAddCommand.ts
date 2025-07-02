import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';
import boxen from 'boxen';

const AVAILABLE_FEATURES = ['ban', 'kick', 'warn'];

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
		// If it's a string, put it in an array, otherwise use the array as is
		selectedFeatures = Array.isArray(features) ? features : [features];
	}

	for (const feat of selectedFeatures) {
		if (!AVAILABLE_FEATURES.includes(feat)) {
			console.error(
				boxen(`❌ Unknown feature: ${feat}`, {
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderStyle: 'single',
					borderColor: 'red',
				}),
			);
			continue; // Continue with the other features instead of returning
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
		console.log(
			boxen(
				'⚠️ components.json not found, using default configuration\n🔁 Event files will be installed to src/components',
				{
					padding: 1,
					borderStyle: 'round',
					borderColor: 'yellow',
				},
			),
		);

		// Detect project type by looking for .ts files
		const hasTypeScript =
			fs.existsSync(path.join(process.cwd(), 'tsconfig.json')) ||
			fs.existsSync(path.join(process.cwd(), 'src', 'index.ts')) ||
			fs.existsSync(path.join(process.cwd(), 'index.ts'));

		// Default configuration
		parseEnvData = {
			ts: hasTypeScript,
			aliases: {
				index: `src/index.${hasTypeScript ? 'ts' : 'js'}`,
				components: 'src/components',
				commands: 'src/commands',
			},
		};

		console.log(
			boxen(
				`📋 Detected project type: ${
					hasTypeScript ? 'TypeScript' : 'JavaScript'
				}`,
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderStyle: 'single',
					borderColor: 'cyan',
				},
			),
		);
	} else {
		parseEnvData = JSON.parse(fs.readFileSync(envData, 'utf-8'));
	}

	const templatePath = path.join(__dirname, '../../modules/components', name);
	const metadataPath = path.join(templatePath, 'meta.json');

	if (!fs.existsSync(templatePath)) {
		console.error(`⚠️ Feature "${name}" is not implemented yet.`);
		return;
	}

	if (!fs.existsSync(metadataPath)) {
		console.error(`⚠️ meta.json not found for feature "${name}"`);
		return;
	}

	const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
	const subFolder = metadata.ranking;
	const targetBasePath = process.cwd();

	// First, automatically copy all event files to components
	const eventsPath = path.join(templatePath, 'files', 'events');
	if (fs.existsSync(eventsPath)) {
		const eventFiles = fs
			.readdirSync(eventsPath)
			.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'));

		for (const eventFile of eventFiles) {
			const sourcePath = path.join(eventsPath, eventFile);

			// Use the components alias to determine the destination path
			const targetSourcePath =
				parseEnvData.aliases?.components || 'src/components';

			const targetPath = path.join(
				targetBasePath,
				targetSourcePath,
				subFolder,
				eventFile,
			);

			copyFileWithAliases(sourcePath, targetPath);
		}
	}

	const commandsPath = path.join(templatePath, 'files', 'commands');
	if (fs.existsSync(commandsPath)) {
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'));

		for (const commandFile of commandFiles) {
			const sourcePath = path.join(commandsPath, commandFile);

			// Use the commands alias to determine the destination path
			const targetSourcePath = parseEnvData.aliases?.commands || 'src/commands';

			const targetPath = path.join(
				targetBasePath,
				targetSourcePath,
				subFolder,
				commandFile,
			);

			copyFileWithAliases(sourcePath, targetPath);
		}
	}

	// Count the total number of files copied
	const eventsCount = fs.existsSync(path.join(templatePath, 'files', 'events'))
		? fs
				.readdirSync(path.join(templatePath, 'files', 'events'))
				.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js')).length
		: 0;

	const commandsCount = fs.existsSync(
		path.join(templatePath, 'files', 'commands'),
	)
		? fs
				.readdirSync(path.join(templatePath, 'files', 'commands'))
				.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js')).length
		: 0;

	const totalFiles = eventsCount + commandsCount;

	console.log(
		boxen(
			`✅ Installed feature "${name}" (${
				parseEnvData.ts ? 'TypeScript' : 'JavaScript'
			}) - ${totalFiles} files copied`,
			{
				padding: 1,
				borderStyle: 'round',
				borderColor: 'green',
				textAlignment: 'center',
			},
		),
	);

	// Add handlers to the project index
	await addHandlersToIndex(name, parseEnvData, templatePath, subFolder);
}

async function addHandlersToIndex(
	featureName: string,
	parseEnvData: { ts: boolean; aliases: Record<string, string> },
	templatePath: string,
	subFolder: string,
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
	const fullComponentsPath = path.join(
		process.cwd(),
		componentsPath,
		subFolder,
	);
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
	console.log(
		boxen(`📝 Updated: ${path.relative(process.cwd(), indexPath)}`, {
			padding: { top: 0, bottom: 0, left: 1, right: 1 },
			borderStyle: 'single',
			borderColor: 'blue',
		}),
	);
}

function copyFileWithAliases(sourcePath: string, targetPath: string) {
	const targetDir = path.dirname(targetPath);

	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	fs.copyFileSync(sourcePath, targetPath);
}
