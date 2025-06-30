import fs from 'fs';
import path from 'path';

import { Client, Collection, GatewayIntentBits } from 'discord.js';
import type {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';

import InteractionCreate from './events/InteractionCreate';
import ClientReady from './events/ClientReady';

import { token } from '../config.json';

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module 'discord.js' {
	export interface Client {
		commands: Collection<string, Command>;
	}
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter(file => file.endsWith('.ts'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command: Command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

ClientReady(client);
InteractionCreate(client);

client.login(token);
