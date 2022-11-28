const { SlashCommandBuilder, SlashCommandUserOption } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Shows the server stats for Wordle!')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to get server stats for.')
            .setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user');

        if (user) {
            const [player, created] = await DATABASE.findOrCreate({
                where: {
                    guild: interaction.guildId,
                    member: user.id
                },
                default: {
                    games: 0,
                    wins: 0,
                    guesses: 0
                }
            });

            await interaction.reply(`Stats for ${user.tag}\nGames: ${player.games} | Wins: ${player.wins} | Guesses: ${player.guesses}`);
        } else {
            const players = await DATABASE.findAll({
                limit: 10,
                where: {
                    guild: interaction.guildId
                }
            });

            if (!players.length) {
                return await interaction.reply(`No stats found for ${interaction.guild.name}`);
            }

            let response = `Stats for ${interaction.guild.name}\n`;

            for (const player of players) {
                const user = await CLIENT.users.fetch(player.member).catch(() => null);

                if (user) {
                    response += `${user.tag} | Games: ${player.games} | Wins: ${player.wins} | Guesses: ${player.guesses}\n`;
                }
            }

            return await interaction.reply(response);
        }
    }
};