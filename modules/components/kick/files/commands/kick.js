const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	PermissionFlagsBits,
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a user from the server')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to ban')
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

	async execute(interaction) {
		const user = interaction.options.getUser('user');

		if (!user) {
			await interaction.reply({ content: 'User not found.', ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setColor('#FFBC00')
			.setTitle('🔄️ Kick command')
			.setDescription(`Are you sure to kick ${user.tag} ?`);

		const confirmButton = new ButtonBuilder()
			.setCustomId(`kick_button::${user.id}`)
			.setLabel(`Confirm Kick`)
			.setStyle(ButtonStyle.Danger);

		const cancelButton = new ButtonBuilder()
			.setCustomId('cancel_kick_button')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder().addComponents(
			confirmButton,
			cancelButton,
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
};
