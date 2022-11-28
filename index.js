require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const Sequelize = require('sequelize');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

global.ROOT = path.resolve(__dirname);
const TOKEN = process.env.TOKEN;

global.CLIENT = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ] 
});

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite'
});

global.DATABASE = sequelize.define('database', {
    guild: Sequelize.STRING,
    member: Sequelize.STRING,
    games: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    guesses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
},
{
    indexes: [
        {
            unique: true,
            fields: ['guild', 'member']
        }
    ]
});

CLIENT.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    CLIENT.commands.set(command.data.name, command);
}

CLIENT.once(Events.ClientReady, c => {
    DATABASE.sync();
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

CLIENT.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

CLIENT.login(TOKEN);