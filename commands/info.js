const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows the information for this bot!'),
    async execute(interaction) {
        await interaction.reply('AUTHOR: dj#9876');
    }
};