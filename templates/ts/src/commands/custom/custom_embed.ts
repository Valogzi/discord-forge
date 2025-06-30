import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('custom_embed')
	.setDescription('Sends a custom embed message.')
	.addStringOption(option =>
		option
			.setName('title')
			.setDescription('The title of the embed')
			.setRequired(true),
	)
	.addStringOption(option =>
		option
			.setName('description')
			.setDescription('The description of the embed')
			.setRequired(true),
	)
	.addStringOption(option =>
		option
			.setName('color')
			.setDescription('The color of the embed in hex format (e.g., #FF0000)')
			.setRequired(false),
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const title = interaction.options.getString('title');
	const description = interaction.options.getString('description');
	const color = interaction.options.getString('color') || '#FFFFFF'; // Default to white if no color is provided

	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor(color ? parseInt(color.replace('#', ''), 16) : 0xffffff) // Default to white if no color is provided
		.setFooter({ text: 'This is a custom embed message.' });

	const button = new ButtonBuilder()
		.setCustomId('custom_button')
		.setLabel('Click Me!')
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

	await interaction.reply({ embeds: [embed], components: [row] });
}
