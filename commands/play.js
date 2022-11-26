const fs = require('node:fs');
const path = require('node:path');
const events = require('node:events');
const { SlashCommandBuilder } = require('discord.js');
const { randomInt } = require('node:crypto');

const NUM_LINES   = 89124; // number of lines in words.txt
const NUM_LETTERS = 5;     // 5 letters for a wordle word
const NUM_BYTES   = 6;     // including '/n' character
const MINUTES     = 30;

const sleep = (millis) => {
    return new Promise(resolve => setTimeout(resolve, millis));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Starts a game of Wordle!'),
    async execute(interaction) {
        await interaction.reply(`The game of wordle will begin in 10 seconds, please react to the ✅ to join!`);
        const initial = await interaction.fetchReply();
        initial.react('✅');

        const offset = Math.ceil(randomInt(NUM_LINES) / NUM_BYTES) * NUM_BYTES;
        const wordsPath = path.join(ROOT, 'words.txt');
        let matrix = [
            '🔳🔳🔳🔳🔳',
            '🔳🔳🔳🔳🔳',
            '🔳🔳🔳🔳🔳',
            '🔳🔳🔳🔳🔳',
            '🔳🔳🔳🔳🔳',
        ];
        let players = [];
        let queue = 10;
        let duration = 60000 * MINUTES;
        let guesses = 0;
        let word;

        // initialize game word
        fs.open(wordsPath, (err, fd) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.error(`[ERROR] ${wordsPath} does not exist!`);
                    return;
                }

                console.error(`[ERROR] Unable to open ${wordsPath}`, err);
                throw err;
            }

            try {
                let buffer = Buffer.alloc(NUM_LETTERS);
                fs.read(fd, buffer, 0, NUM_LETTERS, offset, (err, bytesRead, buf) => {
                    if (err || bytesRead != NUM_LETTERS) {
                        console.log(`[ERROR] Read of ${wordsPath} failed!`);
                    } else {
                        word = buf.toString();
                    }
                });
            } finally {
                fs.close(fd, (err) => {
                    if (err) {
                        console.error(`[ERROR] Unable to close ${wordsPath}`, err);
                        throw err;
                    }
                })
            }
        });

        const reactionFilter = (reaction, user) => {
            return reaction.emoji.name === '✅';
        };

        const queueCollector = initial.createReactionCollector({ filter: reactionFilter, max: 11, time: 10000 });

        queueCollector.on('collect', (reaction, user) => {
            players.push(user.id);
        });

        queueCollector.on('end', collected => {
            console.log(word);
            duration = 60000 * MINUTES; // 30 minutes

            interaction.editReply('This Wordle will no longer take any more players... The game will begin shortly!');
            interaction.followUp(matrix.join('\n'));

            const messageFilter = (message) => {
                return message.content.length == NUM_LETTERS && players.includes(message.member.id)
            };

            let messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: duration })

            messageCollector.on('collect', message => {
                if (message.content === word) {
                    matrix[guesses] = '🟩🟩🟩🟩🟩'
                    interaction.followUp(matrix.join('\n'));
                    guesses++;
                    interaction.followUp(`You guessed ${word} in ${guesses} tries!`);
                    return messageCollector.stop()
                }

                let guess = [];

                for (let i = 0; i < NUM_LETTERS; i++) {
                    let guessLetter = message.content.charAt(i);
                    let solutionLetter = word.charAt(i);

                    if (guessLetter === solutionLetter) {
                        guess.push('🟩');
                    } else if (word.indexOf(guessLetter) != -1) {
                        guess.push('🟨');
                    } else {
                        guess.push('🔳');
                    }
                }

                matrix[guesses] = guess.join(''); 
                interaction.followUp(matrix.join('\n'));
                guesses++;

                if (guesses >= matrix.length - 1) {
                    interaction.followUp(`You failed to solve ${word} in ${matrix.length} tries!`);
                    return messageCollector.stop()
                }
            });

            messageCollector.on('end', reason => {
                if (reason === 'time') {
                    return interaction.followUp('This Wordle has expired.');
                }
            });
        });

        while (queue > 0) {
            queue--;
            interaction.editReply(`The game of wordle will begin in ${queue} seconds, please react to the ✅ to join!`);
            await sleep(1000);
        }
    }
};