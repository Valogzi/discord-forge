import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { exec, execSync } from 'child_process';

import { say } from 'cfonts';
import boxen from 'boxen';

import ora from 'ora';

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
			type: 'confirm',
			name: 'wantAutoConfigSetup',
			message: 'Do you want to automatically configure the bot?',
			default: true,
		},
		{
			type: 'input',
			name: 'guildId',
			message: 'Enter your guild ID (or press Enter to skip):',
			when: answers => answers.wantAutoConfigSetup,
		},
		{
			type: 'input',
			name: 'clientId',
			message: 'Enter your client bot ID (or press Enter to skip):',
			when: answers => answers.wantAutoConfigSetup,
		},
		{
			type: 'password',
			name: 'token',
			message: 'Enter your bot secret token (or press Enter to skip):',
			when: answers => answers.wantAutoConfigSetup,
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

	const { guildId, clientId, token } = await answers;

	const isTs = TYPESCRIPT ? 'ts' : 'js';
	const templatePath = path.join(
		__dirname,
		`../../templates/${TEMPLATE}/${isTs}`,
	);

	console.log('\n');

	const templateLoader = ora('Loading template...').start();
	await new Promise(res => setTimeout(res, 1000));
	templateLoader.succeed(`Using template: ${templatePath}`);
	const targetPath = path.join(
		process.cwd(),
		PROJECT_NAME == '.' ? '' : PROJECT_NAME,
	);

	let projectLoader = ora('Checking target directory...').start();

	if (PROJECT_NAME !== '.') {
		if (fs.existsSync(targetPath)) {
			await new Promise(res => setTimeout(res, 500));
			projectLoader.fail(
				`The directory ${targetPath} already exists. Please choose another name.`,
			);
			return;
		} else {
			await new Promise(res => setTimeout(res, 500));
			// If the project name is not '.', use the specified directory
			projectLoader.succeed(`Using directory: ${targetPath}`);
		}
	} else {
		await new Promise(res => setTimeout(res, 500));
		// If the project name is '.', use the current directory
		projectLoader.succeed(`Using current directory: ${process.cwd()}.`);
	}

	// process.cwd()/<PROJECT_NAME>/config.json or process.cwd()/config.json
	const configDir =
		PROJECT_NAME == '.'
			? process.cwd()
			: path.join(process.cwd(), PROJECT_NAME);

	const configPath = path.join(configDir, 'config.json');

	const configGuildId = guildId ? guildId : '';
	const configClientId = clientId ? clientId : '';
	let configToken = token ? token : '';

	projectLoader = ora('Checking Discord token...').start();
	await new Promise(res => setTimeout(res, 2000));

	const discordTokenVerification = await fetch(
		'https://discord.com/api/v10/users/@me',
		{
			headers: { Authorization: `Bot ${configToken}` },
		},
	);

	if (!discordTokenVerification.ok) {
		projectLoader.fail('Failed to verify the provided Discord token.');
		configToken = '';
	} else {
		projectLoader.succeed('Discord token verified successfully.');
	}

	const configContent = {
		guildId: configGuildId,
		clientId: configClientId,
		token: configToken,
	};

	const configContentParser = JSON.stringify(configContent, null, 2);

	projectLoader = ora('Creating config.json file...').start();
	await new Promise(res => setTimeout(res, 1000));

	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

	fs.writeFileSync(configPath, configContentParser, 'utf8');
	projectLoader.succeed(`Config file created at ${configPath}`);

	projectLoader = ora('Creating project files...').start();
	await new Promise(res => setTimeout(res, 1500));

	fs.cpSync(templatePath, targetPath, { recursive: true });
	projectLoader.succeed(
		`The "${PROJECT_NAME}" project has been successfully created!`,
	);

	if (installDeps) {
		projectLoader = ora('Installing dependencies...').start();
		try {
			execSync(`cd ${PROJECT_NAME} && ${bin} install`, { stdio: 'inherit' });
			projectLoader.succeed('Dependencies installed successfully!');

			if (TYPESCRIPT) {
				projectLoader = ora('Setting up TypeScript environment...').start();
				await new Promise(res => setTimeout(res, 1000));
				projectLoader.succeed('TypeScript development environment ready!');
			}
		} catch (e) {
			projectLoader.fail(
				`Automatic installation failed. Run "${bin} install" manually.`,
			);
			return;
		}
	}

	projectLoader = ora('Finalizing setup...').start();
	await new Promise(res => setTimeout(res, 1000));
	projectLoader.succeed(
		`🚀 Ready! Go to "${PROJECT_NAME}" and launch your bot.`,
	);
};

export default mainAction;
