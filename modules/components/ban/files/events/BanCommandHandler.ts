import {
	Client,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from 'discord.js';

export function BanCommandHandler(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Vérifier si c'est une interaction de bouton
		if (!interaction.isButton()) return;

		if (interaction.customId === 'cancel_ban_button') {
			await interaction.reply({
				content: 'Bannissement annulé.',
				ephemeral: true,
			});
			return;
		}

		// Vérifier si c'est le bouton de ban
		const [interactionId, userId] = interaction.customId.split('::');
		if (interaction.customId.startsWith('ban_button::')) {
			await handleBanButton(interaction, userId);
		}
	});
}

async function handleBanButton(interaction: ButtonInteraction, userId: string) {
	if (interaction.replied || interaction.deferred) return;

	try {
		// Créer un modal
		const modal = new ModalBuilder()
			.setCustomId(`ban_modal::${userId}`)
			.setTitle('Bannir un utilisateur');

		const reasonInput = new TextInputBuilder()
			.setCustomId('ban_reason')
			.setLabel('Raison du bannissement')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(false)
			.setPlaceholder('Violation des règles du serveur...')
			.setMaxLength(512);

		const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
			reasonInput,
		);

		modal.addComponents(reasonRow);

		await interaction.showModal(modal); // ✅ UNE SEULE réponse
	} catch (error) {
		console.error('Erreur lors de la gestion du bouton ban:', error);

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
export function handleBanModal(client: Client) {
	client.on('interactionCreate', async interaction => {
		// Vérifier si c'est une soumission de modal
		if (!interaction.isModalSubmit()) return;

		const [interactionId, userId] = interaction.customId.split('::');
		// Vérifier si c'est le modal de ban
		if (interaction.customId.startsWith('ban_modal::')) {
			try {
				// Récupérer les valeurs du modal
				const reason =
					interaction.fields.getTextInputValue('ban_reason') ||
					'Aucune raison spécifiée';

				// Vérifier les permissions
				if (!interaction.memberPermissions?.has('BanMembers')) {
					await interaction.reply({
						content: "Vous n'avez pas la permission de bannir des membres.",
						ephemeral: true,
					});
					return;
				}

				// Essayer de bannir l'utilisateur
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
					await guildMember.ban({
						reason: `Banni par ${interaction.user.tag}: ${reason}`,
					});

					await interaction.reply({
						content: `✅ Utilisateur <@${userId}> banni avec succès.\n**Raison:** ${reason}`,
						ephemeral: true,
					});
				} catch (banError) {
					console.error('Erreur lors du bannissement:', banError);
					await interaction.reply({
						content:
							"❌ Impossible de bannir cet utilisateur. Vérifiez l'ID et mes permissions.",
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
