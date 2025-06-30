import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';

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

	console.log(
		`✅ Installed feature "${name}" (${
			parseEnvData.ts ? 'TypeScript' : 'JavaScript'
		}) - ${totalFiles} files copied`,
	);
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
