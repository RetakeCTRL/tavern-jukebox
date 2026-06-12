const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Loading local tavern ambience...`);
    
    const channel = client.channels.cache.get(process.env.VOICE_CHANNEL_ID);
    if (!channel) return console.error("Voice channel not found! Check your VOICE_CHANNEL_ID.");

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    const playMusic = () => {
        try {
            // Pointing directly to the file inside the GitHub repository
            const audioPath = path.join(__dirname, 'ambience.mp3');
            
            const resource = createAudioResource(audioPath, {
                inlineVolume: true
            });
            
            resource.volume.setVolume(0.5);

            player.play(resource);
            connection.subscribe(player);
            console.log("Playing secure local ambience track at 50% volume...");
        } catch (error) {
            console.error("Error playing local file:", error);
            setTimeout(playMusic, 5000); 
        }
    };

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track finished. Looping local audio...");
        playMusic(); 
    });

    player.on('error', error => {
        console.error('Audio Player Error:', error.message);
        playMusic();
    });

    playMusic();
});

client.login(process.env.DISCORD_TOKEN);
