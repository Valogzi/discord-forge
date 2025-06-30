import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { execSync } from 'child_process';

const program = new Command();
program
	.name('discord-forge')
	.description(
		'A CLI tool for creating Discord bots whith operational templates.',
	)
	.version('0.1.0');

const defaultProjectName = path.basename(process.cwd());

program
	.command('create')
	.description('Clone a discord bot template.')
	.action(async () => {
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
				choices: [
					{ name: '🔵 TypeScript', value: 'ts' },
					{ name: '🟡 JavaScript', value: 'js' },
				],
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
				],
			},
		]);

		const { PROJECT_NAME, TEMPLATE, installDeps, bin } = await answers;
		const templatePath = path.join(__dirname, `./templates/${TEMPLATE}`);
		console.log(`📂 Using template: ${templatePath}`);
		const targetPath = path.join(process.cwd(), PROJECT_NAME);

		if (fs.existsSync(targetPath) && targetPath !== '.') {
			console.error(`❌ Le dossier "${PROJECT_NAME}" existe déjà.`);
			process.exit(1);
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

				if (TEMPLATE === 'ts')
					console.log('🔧 Installed developpement TypeScript dependencies...');

				console.log('📦 Installed dependencies.');
				execSync(`cd ${PROJECT_NAME}`);
			} catch (e) {
				console.log(
					`⚠️ Automatic installation failed. Run "${bin} install" manually.`,
				);
			}
		}

		console.log(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`);
	});

program.parse();
