import { ActivityType, Events } from 'discord.js';
import type { Client } from 'discord.js';

export default function ClientReady(client: Client) {
	client.once(Events.ClientReady, readyClient => {
		console.log(`Ready! Logged in as ${readyClient.user.tag}`);

		readyClient.user.setPresence({
			activities: [
				{
					name: 'Made with create-discord-forge CLI',
					type: ActivityType.Playing,
				},
			],
			status: 'online',
		});
	});
}
