import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { exec, execSync } from 'child_process';

const defaultProjectName = path.basename(process.cwd());

const mainAction = async () => {
	const answers = inquirer.prompt([
		{
			type: 'input',
			name: 'PROJECT_NAME',
			message: 'Project name:',
			default: defaultProjectName,
			validate: input => input.length > 0 || 'Le nom ne peut pas être vide.',
		},
		{
			type: 'select',
			name: 'TEMPLATE',
			message: 'Select a template:',
			choices: [{ name: '📦 >> default', value: 'default' }],
		},
		{
			type: 'confirm',
			name: 'TYPESCRIPT',
			message: 'Do you want to use TypeScript?',
			default: true,
		},
		{
			type: 'confirm',
			name: 'installDeps',
			message: 'Did you want to install dependencies?',
			default: true,
		},
		{
			type: 'select',
			name: 'bin',
			message: `Which engine do you want to use?`,
			choices: [
				{ name: '📦 npm', value: 'npm' },
				{ name: '🪄  pnpm', value: 'pnpm' },
				{ name: '🚀  yarn', value: 'yarn' },
				{ name: '🔧  bun', value: 'bun' },
			],
		},
	]);

	const { PROJECT_NAME, TEMPLATE, TYPESCRIPT, installDeps, bin } =
		await answers;
	const isTs = TYPESCRIPT ? 'ts' : 'js';
	const templatePath = path.join(
		__dirname,
		`../../templates/${TEMPLATE}/${isTs}`,
	);
	console.log(`📂 Using template: ${templatePath}`);
	const targetPath = path.join(
		process.cwd(),
		PROJECT_NAME == '.' ? '' : PROJECT_NAME,
	);

	if (PROJECT_NAME !== '.') {
		if (fs.existsSync(targetPath)) {
			console.error(`❌ The folder "${PROJECT_NAME}" already exist.`);
			process.exit(1);
		}
	}

	fs.cpSync(templatePath, targetPath, { recursive: true });
	console.log(
		`✅ The "${PROJECT_NAME}" project has been successfully created !`,
	);

	if (installDeps) {
		try {
			console.log('-----------------------------------------------');
			execSync(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
			console.log('-----------------------------------------------');

			if (TYPESCRIPT)
				console.log('🔧 Installed developpement TypeScript dependencies...');

			console.log('📦 Installed dependencies.');
		} catch (e) {
			console.log(
				`⚠️ Automatic installation failed. Run "${bin} install" manually.`,
			);
		}
	}

	console.log(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`);
};

export default mainAction;
