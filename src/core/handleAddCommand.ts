import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';
import boxen from 'boxen';

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
	const indexPath = path.join(
		process.cwd(),
		parseEnvData.aliases.index || `src/index.${parseEnvData.ts ? 'ts' : 'js'}`,
	);

	if (!fs.existsSync(indexPath)) {
		console.error(
			boxen(`❌ Index file not found at: ${indexPath}`, {
				padding: 1,
				borderStyle: 'single',
				borderColor: 'red',
			}),
		);
		return;
	}

	const sourceFile = project.addSourceFileAtPath(indexPath);
	const eventsPath = path.join(templatePath, 'files', 'events');
	const eventFiles = fs.existsSync(eventsPath)
		? fs
				.readdirSync(eventsPath)
				.filter(file => file.endsWith(parseEnvData.ts ? '.ts' : '.js'))
		: [];

	for (const eventFile of eventFiles) {
		const handlerName = path.basename(
			eventFile,
			parseEnvData.ts ? '.ts' : '.js',
		);
		const importPath = path
			.join(
				parseEnvData.aliases.components || 'src/components',
				subFolder,
				handlerName,
			)
			.replace(/\\/g, '/'); // Normalize for import

		// Check if the import already exists
		const existingImport = sourceFile.getImportDeclaration(
			d => d.getModuleSpecifier().getLiteralValue() === importPath,
		);

		if (!existingImport) {
			sourceFile.addImportDeclaration({
				moduleSpecifier: importPath,
				namedImports: [handlerName],
			});
		}

		// Find the client.login() call
		const callExpressions = sourceFile.getDescendantsOfKind(
			SyntaxKind.CallExpression,
		);
		const loginCall = callExpressions.find(
			c => c.getExpression().getText() === 'client.login',
		);

		if (loginCall) {
			const sourceFile = loginCall.getSourceFile();
			// Check if the handler call already exists
			const isHandlerCalled = callExpressions.some(
				c => c.getExpression().getText() === handlerName,
			);

			if (!isHandlerCalled) {
				sourceFile.addStatements(`${handlerName}(client);`);
			}
		} else {
			console.warn(
				boxen(
					`⚠️ Could not find 'client.login()' in ${indexPath}. Handler '${handlerName}' not added.`,
					{
						padding: 1,
						borderStyle: 'round',
						borderColor: 'yellow',
					},
				),
			);
		}
	}

	await sourceFile.save();
	console.log(
		boxen(`✅ Handlers for "${featureName}" added to index.`, {
			padding: 1,
			borderStyle: 'round',
			borderColor: 'green',
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
