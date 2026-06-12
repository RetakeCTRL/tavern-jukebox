const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// The Alliance Taverns Ambience
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=Oeo2VCCtUZQ';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Ready to set the mood.`);
    
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

    const playMusic = async () => {
        try {
            const stream = await play.stream(YOUTUBE_URL);
            
            // Enable inline volume to adjust the output
            const resource = createAudioResource(stream.stream, { 
                inputType: stream.type,
                inlineVolume: true 
            });
            
            // Lock volume at 50%
            resource.volume.setVolume(0.5);

            player.play(resource);
            connection.subscribe(player);
            console.log("Playing tavern ambience at 50% volume...");
        } catch (error) {
            console.error("Error playing stream:", error);
            setTimeout(playMusic, 10000); 
        }
    };

    // Loop the track when it finishes
    player.on(AudioPlayerStatus.Idle, () => {
        playMusic();
    });

    player.on('error', error => {
        console.error('Audio Player Error:', error.message);
        playMusic();
    });

    await playMusic();
});

client.login(process.env.DISCORD_TOKEN);