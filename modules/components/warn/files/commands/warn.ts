import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('warn')
	.setDescription('Warn a user')
	.addUserOption(option =>
		option.setName('user').setDescription('The user to warn').setRequired(true),
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export const execute = async (interaction: ChatInputCommandInteraction) => {
	const user = interaction.options.getUser('user');

	if (!user) {
		await interaction.reply({ content: 'User not found.', ephemeral: true });
		return;
	}

	const embed = new EmbedBuilder()
		.setColor('#FFA500')
		.setTitle('⚠️ Warn command')
		.setDescription(`Are you sure to warn ${user.tag}?`);

	const confirmButton = new ButtonBuilder()
		.setCustomId(`warn_button::${user.id}`)
		.setLabel('Confirm Warn')
		.setStyle(ButtonStyle.Danger);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		confirmButton,
	);

	await interaction.reply({
		embeds: [embed],
		components: [row],
		ephemeral: true,
	});
};
