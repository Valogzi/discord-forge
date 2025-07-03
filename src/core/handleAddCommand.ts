import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';
import boxen from 'boxen';
import ora from 'ora';

const AVAILABLE_FEATURES = ['ban', 'kick', 'warn'];

export async function handleAddCommand(
	typescript: boolean,
	features?: string | string[],
) {
	let selectedFeatures: string[] = [];

	let ts = false;

	if (typeof features === 'object' && features.length > 0) {
		if (features[features.length - 1].includes('-')) {
			features.pop();
		}
	}

	if (!features || (Array.isArray(features) && features.length === 0)) {
		const { chosen, TYPESCRIPT } = await inquirer.prompt([
			{
				name: 'TYPESCRIPT',
				type: 'confirm',
				message: 'Do you want to use TypeScript?',
				when: () => !typescript, // Only ask if typescript is not already set
				default: true,
			},
			{
				name: 'chosen',
				type: 'checkbox',
				message: 'Which features do you want to add?',
				choices: AVAILABLE_FEATURES,
			},
		]);
		selectedFeatures = chosen;
		ts = !TYPESCRIPT ? typescript : TYPESCRIPT; // Use the TypeScript option from the prompt
	} else {
		// If it's a string, put it in an array, otherwise use the array as is
		selectedFeatures = Array.isArray(features) ? features : [features];
		ts = typescript; // Use the provided TypeScript option or default to false
	}

	console.log('\n');

	const mainLoader = ora('Validating selected features...').start();
	await new Promise(res => setTimeout(res, 500));

	for (const feat of selectedFeatures) {
		if (!AVAILABLE_FEATURES.includes(feat)) {
			mainLoader.fail(`Unknown feature: ${feat}`);
			continue; // Continue with the other features instead of returning
		}
	}

	mainLoader.succeed(
		`${selectedFeatures.length} feature(s) validated successfully`,
	);

	for (const feat of selectedFeatures) {
		if (AVAILABLE_FEATURES.includes(feat)) {
			await installFeature(feat, ts);
		}
	}
}

async function installFeature(name: string, ts: boolean) {
	let featureLoader = ora(`Installing feature "${name}"...`).start();

	const envData = path.join(process.cwd(), 'components.json');

	let parseEnvData: {
		ts: boolean;
		aliases: Record<string, string>;
	};

	featureLoader.text = 'Checking components.json configuration...';
	await new Promise(res => setTimeout(res, 300));

	if (!fs.existsSync(envData)) {
		featureLoader.warn(
			'components.json not found, using default configuration',
		);

		// Default configuration
		parseEnvData = {
			ts: ts,
			aliases: {
				index: `src/index.${ts ? 'ts' : 'js'}`,
				components: 'src/components',
				commands: 'src/commands',
			},
		};

		featureLoader = ora(`Detecting project type...`).start();
		await new Promise(res => setTimeout(res, 500));
		featureLoader.succeed(
			`Project type detected: ${ts ? 'TypeScript' : 'JavaScript'}`,
		);
	} else {
		parseEnvData = JSON.parse(fs.readFileSync(envData, 'utf-8'));
		featureLoader.succeed('Configuration loaded from components.json');
	}

	const templatePath = path.join(__dirname, '../../modules/components', name);
	const metadataPath = path.join(templatePath, 'meta.json');

	featureLoader = ora('Validating feature template...').start();
	await new Promise(res => setTimeout(res, 300));

	if (!fs.existsSync(templatePath)) {
		featureLoader.fail(`Feature "${name}" is not implemented yet.`);
		return;
	}

	if (!fs.existsSync(metadataPath)) {
		featureLoader.fail(`meta.json not found for feature "${name}"`);
		return;
	}

	const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
	const subFolder = metadata.ranking;
	const targetBasePath = process.cwd();

	featureLoader.succeed('Feature template validated successfully');

	// First, automatically copy all event files to components
	featureLoader = ora('Copying event files...').start();
	await new Promise(res => setTimeout(res, 500));

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
		featureLoader.succeed(
			`${eventFiles.length} event file(s) copied successfully`,
		);
	} else {
		featureLoader.info('No event files found to copy');
	}

	featureLoader = ora('Copying command files...').start();
	await new Promise(res => setTimeout(res, 500));

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
		featureLoader.succeed(
			`${commandFiles.length} command file(s) copied successfully`,
		);
	} else {
		featureLoader.info('No command files found to copy');
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

	featureLoader = ora('Finalizing feature installation...').start();
	await new Promise(res => setTimeout(res, 300));
	featureLoader.succeed(
		`Feature "${name}" installed successfully (${
			parseEnvData.ts ? 'TypeScript' : 'JavaScript'
		}) - ${totalFiles} files copied`,
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
	let indexLoader = ora('Updating index file...').start();
	await new Promise(res => setTimeout(res, 500));

	const project = new Project();
	const indexAlias =
		parseEnvData.aliases?.index || `src/index.${parseEnvData.ts ? 'ts' : 'js'}`;
	const indexPath = path.join(process.cwd(), indexAlias);

	if (!fs.existsSync(indexPath)) {
		indexLoader.fail(`Index file not found: ${indexPath}`);
		return;
	} else {
		indexLoader.succeed(
			`Index file found: ${path.relative(process.cwd(), indexPath)}`,
		);
	}

	// Charger le fichier index
	const sourceFile = project.addSourceFileAtPath(indexPath);

	// Trouver les fichiers events à importer
	const eventsPath = path.join(templatePath, 'files', 'events');
	if (!fs.existsSync(eventsPath)) {
		indexLoader.info('No event files to import');
		return;
	} else {
		indexLoader.succeed(`Event files found: ${eventsPath}`);
	}

	const eventFiles = fs
		.readdirSync(eventsPath)
		.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'))
		.map(file => path.basename(file, path.extname(file)));

	indexLoader = ora('Adding imports to index file...').start();
	await new Promise(res => setTimeout(res, 300));

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

	indexLoader.succeed(
		`Imports added to index file: ${path.relative(process.cwd(), indexPath)}`,
	);

	indexLoader = ora('Adding handler calls to index file...').start();
	await new Promise(res => setTimeout(res, 300));

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
	indexLoader.succeed(
		`Index file updated: ${path.relative(process.cwd(), indexPath)}`,
	);

	return;
}

function copyFileWithAliases(sourcePath: string, targetPath: string) {
	const targetDir = path.dirname(targetPath);

	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	fs.copyFileSync(sourcePath, targetPath);
}
