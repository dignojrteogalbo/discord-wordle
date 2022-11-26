require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const { TOKEN,
    CLIENT_ID,
    TESTING_GUILD_ID,
    TESTING_CHANNEL_ID
} = process.env;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
	try {
		console.log(`[TESTING] Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, TESTING_GUILD_ID),
			{ body: commands },
		);

		console.log(`[TESTING] Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();