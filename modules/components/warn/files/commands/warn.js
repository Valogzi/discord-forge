const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a user')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to warn')
				.setRequired(true),
		),
	async execute(interaction) {
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
			.setLabel(`Confirm Warn`)
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder().addComponents(confirmButton);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
};
