import {
	Client,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';

function KickCommandHandler(client) {
	client.on('interactionCreate', async interaction => {
		// Vérifier si c'est une interaction de bouton
		if (!interaction.isButton()) return;

		if (interaction.customId === 'cancel_kick_button') {
			await interaction.reply({
				content: 'Kick annulé.',
				ephemeral: true,
			});
			return;
		}

		// Vérifier si c'est le bouton de kick
		const [interactionId, userId] = interaction.customId.split('::');
		if (interaction.customId.startsWith('kick_button::')) {
			await handleKickButton(interaction, userId);
		}
	});
}

async function handleKickButton(interaction, userId) {
	if (interaction.replied || interaction.deferred) return;

	try {
		// Créer un modal
		const modal = new ModalBuilder()
			.setCustomId(`kick_modal::${userId}`)
			.setTitle('Kicker un utilisateur');

		const reasonInput = new TextInputBuilder()
			.setCustomId('kick_reason')
			.setLabel('Raison du kick')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setPlaceholder('Violation des règles du serveur...')
			.setMaxLength(512);

		const reasonRow = new ActionRowBuilder().addComponents(reasonInput);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ UNE SEULE réponse
	} catch (error) {
		console.error('Erreur lors de la gestion du bouton kick:', error);

		// Ne pas tenter de reply si déjà fait
		if (!interaction.replied && !interaction.deferred) {
			try {
				await interaction.reply({
					content:
						'Une erreur est survenue lors du traitement de votre demande.',
					ephemeral: true,
				});
			} catch (e) {
				console.error('Erreur lors du reply de fallback:', e);
			}
		}
	}
}

// Gestionnaire pour la soumission du modal
function handleKickModal(client) {
	client.on('interactionCreate', async interaction => {
		// Vérifier si c'est une soumission de modal
		if (!interaction.isModalSubmit()) return;

		const [interactionId, userId] = interaction.customId.split('::');
		// Vérifier si c'est le modal de kick
		if (interaction.customId.startsWith('kick_modal::')) {
			try {
				// Récupérer les valeurs du modal
				const reason =
					interaction.fields.getTextInputValue('kick_reason') ||
					'Aucune raison spécifiée';

				// Vérifier les permissions
				if (!interaction.memberPermissions?.has('KickMembers')) {
					await interaction.reply({
						content: "Vous n'avez pas la permission de kick des membres.",
						ephemeral: true,
					});
					return;
				}

				// Essayer de kick l'utilisateur
				const guild = interaction.guild;
				if (!guild) {
					await interaction.reply({
						content:
							'Cette commande ne peut être utilisée que dans un serveur.',
						ephemeral: true,
					});
					return;
				}

				try {
					const guildMember = await guild.members.fetch(userId);
					await guildMember.kick(`Kick par ${interaction.user.tag}: ${reason}`);

					await interaction.reply({
						content: `✅ Utilisateur <@${userId}> kick avec succès.\n**Raison:** ${reason}`,
						ephemeral: true,
					});
				} catch (kickError) {
					console.error('Erreur lors du kick:', kickError);
					await interaction.reply({
						content:
							"❌ Impossible de kick cet utilisateur. Vérifiez l'ID et mes permissions.",
						ephemeral: true,
					});
				}
			} catch (error) {
				console.error('Erreur lors de la soumission du modal:', error);

				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content:
							'Une erreur est survenue lors du traitement de votre demande.',
						ephemeral: true,
					});
				}
			}
		}
	});
}

module.exports = { KickCommandHandler, handleKickModal };
