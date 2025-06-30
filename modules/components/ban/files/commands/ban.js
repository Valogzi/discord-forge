const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a user from the server')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to ban')
				.setRequired(true),
		),
	async execute(interaction) {
		const user = interaction.options.getUser('user');

		if (!user) {
			await interaction.reply({ content: 'User not found.', ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setColor('#FF0000')
			.setTitle('🚫 Ban command')
			.setDescription(`Are you sure to ban ${user.tag} ?`);

		const confirmButton = new ButtonBuilder()
			.setCustomId('ban_button')
			.setLabel('Confirm Ban')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder().addComponents(confirmButton);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
};
