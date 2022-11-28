const fs = require('node:fs');
const path = require('node:path');
const events = require('node:events');
const { SlashCommandBuilder } = require('discord.js');
const { randomInt } = require('node:crypto');
const { Stats } = require('node:fs');

const NUM_LINES   = 5757;  // number of lines in words.txt
const NUM_LETTERS = 5;     // 5 letters for a wordle word
const NUM_BYTES   = 6;     // including '/n' character
const MINUTES     = 60000; // 1 minute in ms
const SECONDS     = 1000;  // 1 second in ms

const EMOJI_CODES = {
    "green": {
        "a": "<:1f1e6:1046189665994158142>",
        "b": "<:1f1e7:1046189667067887666>",
        "c": "<:1f1e8:1046189667814473781>",
        "d": "<:1f1e9:1046189669508976680>",
        "e": "<:1f1ea:1046189670461091881>",
        "f": "<:1f1eb:1046189672080080916>",
        "g": "<:1f1ec:1046189673107697775>",
        "h": "<:1f1ed:1046189674131112007>",
        "i": "<:1f1ee:1046189675305500742>",
        "j": "<:1f1ef:1046189676467335288>",
        "k": "<:1f1f0:1046189677272649791>",
        "l": "<:1f1f1:1046189678455443499>",
        "m": "<:1f1f2:1046189679977959495>",
        "n": "<:1f1f3:1046189681022345287>",
        "o": "<:1f1f4:1046189681676648449>",
        "p": "<:1f1f5:1046189683496988822>",
        "q": "<:1f1f6:1046189684998553610>",
        "r": "<:1f1f7:1046189686193922232>",
        "s": "<:1f1f8:1046189687309602938>",
        "t": "<:1f1f9:1046189688597258290>",
        "u": "<:1f1fa:1046189689750696017>",
        "v": "<:1f1fb:1046189690795081808>",
        "w": "<:1f1fc:1046189691969490986>",
        "x": "<:1f1fd:1046189693039022150>",
        "y": "<:1f1fe:1046189998258524212>",
        "z": "<:1f1ff:1046189999353237554>",
    },
    "yellow": {
        "a": "<:1f1e6:1046190102608629800>",
        "b": "<:1f1e7:1046190103728500767>",
        "c": "<:1f1e8:1046190104663818363>",
        "d": "<:1f1e9:1046190105733386310>",
        "e": "<:1f1ea:1046190106781962310>",
        "f": "<:1f1eb:1046190107792789624>",
        "g": "<:1f1ec:1046190108803612732>",
        "h": "<:1f1ed:1046190110095442070>",
        "i": "<:1f1ee:1046190111534100660>",
        "j": "<:1f1ef:1046190112473624606>",
        "k": "<:1f1f0:1046190113568346162>",
        "l": "<:1f1f1:1046190114684014724>",
        "m": "<:1f1f2:1046190116017807360>",
        "n": "<:1f1f3:1046190116961521697>",
        "o": "<:1f1f4:1046190118484066414>",
        "p": "<:1f1f5:1046190119784292473>",
        "q": "<:1f1f6:1046190120899973120>",
        "r": "<:1f1f7:1046190121923395642>",
        "s": "<:1f1f8:1046190122951004160>",
        "t": "<:1f1f9:1046190124297371719>",
        "u": "<:1f1fa:1046190126864289822>",
        "v": "<:1f1fb:1046190128072249414>",
        "w": "<:1f1fc:1046190129133408308>",
        "x": "<:1f1fd:1046190130156798022>",
        "y": "<:1f1fe:1046190131243143249>",
        "z": "<:1f1ff:1046190132061020213>",
    },
    "gray": {
        "a": "<:1f1e6:1046189367804301442>",
        "b": "<:1f1e7:1046189368907399228>",
        "c": "<:1f1e8:1046189369876295730>",
        "d": "<:1f1e9:1046189370849366068>",
        "e": "<:1f1ea:1046189371960873001>",
        "f": "<:1f1eb:1046189373084926083>",
        "g": "<:1f1ec:1046189374280319106>",
        "h": "<:1f1ed:1046189375295340554>",
        "i": "<:1f1ee:1046189375916085293>",
        "j": "<:1f1ef:1046189377568657518>",
        "k": "<:1f1f0:1046189378688528466>",
        "l": "<:1f1f1:1046189380588548138>",
        "m": "<:1f1f2:1046189382278856704>",
        "n": "<:1f1f3:1046189383541346456>",
        "o": "<:1f1f4:1046189384950624276>",
        "p": "<:1f1f5:1046189386347315281>",
        "q": "<:1f1f6:1046189387588837428>",
        "r": "<:1f1f7:1046189388524175381>",
        "s": "<:1f1f8:1046189389400780851>",
        "t": "<:1f1f9:1046189390982029424>",
        "u": "<:1f1fa:1046189392152231966>",
        "v": "<:1f1fb:1046189393381179492>",
        "w": "<:1f1fc:1046189394383609967>",
        "x": "<:1f1fd:1046189395436376085>",
        "y": "<:1f1fe:1046189396648538204>",
        "z": "<:1f1ff:1046189397835530330>",
    },
}

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
        let players = [];
        let queue = 10;
        let guesses = 0;
        let word;
        let matrix = [
            '<:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086>',
            '<:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086>',
            '<:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086>',
            '<:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086>',
            '<:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086><:flat:1046193584988246086>',
        ];

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
            return reaction.emoji.name === '✅' && !user.bot;
        };

        const queueCollector = initial.createReactionCollector({ filter: reactionFilter, max: 11, time: 10 * SECONDS });

        queueCollector.on('collect', (reaction, user) => {
            players.push(user.id);
        });

        queueCollector.on('end', (collected, reason) => {
            console.log(word);

            interaction.editReply('This Wordle will no longer take any more players... The game will begin shortly!');
            interaction.followUp(matrix.join('\n'));

            const messageFilter = (message) => {
                return message.content.length == NUM_LETTERS && players.includes(message.member.id)
            };

            let messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: 30 * MINUTES })

            messageCollector.on('collect', message => {
                const input = message.content.toLowerCase();
                let guess = [];

                for (let i = 0; i < NUM_LETTERS; i++) {
                    let guessLetter = input.charAt(i);
                    let solutionLetter = word.charAt(i);

                    if (guessLetter === solutionLetter) {
                        guess.push(EMOJI_CODES['green'][guessLetter]);
                    } else if (word.includes(guessLetter)) {
                        guess.push(EMOJI_CODES['yellow'][guessLetter]);
                    } else {
                        guess.push(EMOJI_CODES['gray'][guessLetter]);
                    }
                }

                matrix[guesses] = guess.join(''); 
                interaction.followUp(matrix.join('\n'));
                guesses++;

                if (input === word) {
                    interaction.followUp(`${message.member.user.tag} guessed **${word}** after ${guesses} tries!`);
                    return messageCollector.stop(`win ${guesses}`)
                }

                if (guesses >= matrix.length) {
                    interaction.followUp(`You failed to solve **${word}** in ${matrix.length} tries!`);
                    return messageCollector.stop(`loss ${guesses}`)
                }
            });

            messageCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    return interaction.followUp('This Wordle has expired.');
                }

                const [ verdict, guesses ] = reason.split(' ');

                for (const player of players) {
                    const [member, created] = await DATABASE.findOrCreate({
                        where: {
                            guild: interaction.guildId,
                            member: player
                        },
                        defaults: {
                            games: 1,
                            wins: (verdict === 'win') ? 1 : 0,
                            guesses: parseInt(guesses)
                        }
                    });

                    if (!created) {
                        member.increment({
                            games: 1,
                            wins: (verdict === 'win') ? 1 : 0,
                            guesses: parseInt(guesses)
                        });
                    }
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