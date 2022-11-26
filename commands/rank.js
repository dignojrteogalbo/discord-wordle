const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Shows the server stats for Wordle!'),
    async execute(interaction) {
        await interaction.reply('Rank!');
    }
};