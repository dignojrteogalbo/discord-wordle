const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quit')
        .setDescription('Quits your current game of Wordle!'),
    async execute(interaction) {
        await interaction.reply('Quit!');
    }
};