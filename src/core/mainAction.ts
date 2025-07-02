import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { exec, execSync } from 'child_process';

import { say } from 'cfonts';
import boxen from 'boxen';

const defaultProjectName = path.basename(process.cwd());

const mainAction = async () => {
	const author = 'Author: Valogzi';
	const github = 'GitHub: https://github.com/valogzi';
	const description =
		'🚀 Welcome to Discord Forge CLI to easily configure Discord.js bot template ';

	const message = `${description}\n\n${author}\n${github}`;

	say('Discord forge', {
		font: 'block', // Use block font
		align: 'left', // Align to the left for a closer look to the image
		colors: ['system'], // Use default system colors
		background: 'transparent',
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		gradient: ['#6471ff', '#2871EE'], // Gradient from blue to pink
		independentGradient: true, // Apply gradient to each letter
		transitionGradient: true, // Create a smooth transition between gradient colors
	});
	console.log(
		boxen(message, {
			padding: 1,
			borderStyle: 'round',
			borderColor: 'blue',
		}) + '\n\n',
	);

	const answers = inquirer.prompt([
		{
			type: 'input',
			name: 'PROJECT_NAME',
			message: 'Project name:',
			default: defaultProjectName,
			validate: input => input.length > 0 || 'The name cannot be empty.',
		},
		{
			type: 'select',
			name: 'TEMPLATE',
			message: 'Select a template:',
			choices: [{ name: 'Default', value: 'default' }],
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
			message: 'Do you want to install dependencies?',
			default: true,
		},
		{
			type: 'select',
			name: 'bin',
			message: `Which engine do you want to use?`,
			choices: [
				{ name: '📦 npm', value: 'npm' },
				{ name: '🪄  pnpm', value: 'pnpm' },
				{ name: '🚀 yarn', value: 'yarn' },
				{ name: '🔧 bun', value: 'bun' },
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
	console.log('\n\n');
	console.log(
		boxen(`📂 Using template: ${templatePath}`, {
			padding: { top: 0, bottom: 0, left: 1, right: 1 },
			borderStyle: 'round',
			borderColor: 'cyan',
		}),
	);
	const targetPath = path.join(
		process.cwd(),
		PROJECT_NAME == '.' ? '' : PROJECT_NAME,
	);

	if (PROJECT_NAME !== '.') {
		if (fs.existsSync(targetPath)) {
			console.log(
				boxen(
					`⚠️ The directory ${targetPath} already exists. Please choose another name.`,
					{
						padding: 1,
						borderStyle: 'round',
						borderColor: 'yellow',
					},
				),
			);
			return;
		}
	}

	fs.cpSync(templatePath, targetPath, { recursive: true });
	console.log(
		boxen(`✅ The "${PROJECT_NAME}" project has been successfully created !`, {
			padding: 1,
			borderStyle: 'round',
			borderColor: 'green',
			textAlignment: 'center',
		}),
	);

	if (installDeps) {
		try {
			console.log(
				boxen('🔄 Installing dependencies...', {
					padding: { top: 0, bottom: 0, left: 2, right: 2 },
					borderStyle: 'single',
					borderColor: 'yellow',
					textAlignment: 'center',
				}),
			);
			execSync(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
			console.log(
				boxen('📦 Dependencies installed successfully!', {
					padding: 1,
					borderStyle: 'round',
					borderColor: 'green',
				}),
			);

			if (TYPESCRIPT) {
				console.log(
					boxen('🔧 TypeScript development environment ready!', {
						padding: { top: 0, bottom: 0, left: 1, right: 1 },
						borderStyle: 'single',
						borderColor: 'blue',
					}),
				);
			}
		} catch (e) {
			console.log(
				boxen(
					`⚠️ Automatic installation failed. Run "${bin} install" manually.`,
					{
						padding: 1,
						borderStyle: 'double',
						borderColor: 'yellow',
					},
				),
			);
		}
	}

	console.log(
		boxen(`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`, {
			padding: 1,
			borderStyle: 'double',
			borderColor: 'magenta',
			textAlignment: 'center',
			title: '🎉 SUCCESS',
			titleAlignment: 'center',
		}),
	);
};

export default mainAction;
