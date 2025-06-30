import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('private_message')
	.setDescription(
		'Sends a private message to the user who invoked the command.',
	)
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user to send a private message to')
			.setRequired(false),
	)
	.addStringOption(option =>
		option
			.setName('message')
			.setDescription('The message to send')
			.setRequired(true),
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const user = interaction.options.getUser('user') || interaction.user;
	const message = interaction.options.getString('message')!;
	// Send a private message to the user who invoked the command
	await user
		.send(message)
		.then(() => {
			interaction.reply({ content: 'Message sent!', ephemeral: true });
		})
		.catch(error => {
			console.error('Error sending private message:', error);
			interaction.reply({
				content: 'Failed to send message.',
				ephemeral: true,
			});
		});
}
