const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// Your direct Discord attachment link
const AUDIO_URL = 'https://cdn.discordapp.com/attachments/1515014167390715974/1515014263763239053/ambience.mp3?ex=6a2d767c&is=6a2c24fc&hm=63bbabb3ae768c83adc3f98df28d9d01e7c26be440fa4bdaf7530ddb7459394c&';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Loading tavern ambience from secure URL...`);
    
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
            // Create the resource directly from the URL link
            const resource = createAudioResource(AUDIO_URL, {
                inlineVolume: true
            });
            
            // Set volume to 50%
            resource.volume.setVolume(0.5);

            player.play(resource);
            connection.subscribe(player);
            console.log("Playing tavern ambience from Discord CDN at 50% volume...");
        } catch (error) {
            console.error("Error playing remote audio file:", error);
            setTimeout(playMusic, 5000); // Retry after 5 seconds if it fails
        }
    };

    // When the track finishes, trigger it to play again instantly
    player.on(AudioPlayerStatus.Idle, () => {
        console.log("Track finished. Looping audio...");
        playMusic();
    });

    player.on('error', error => {
        console.error('Audio Player Error:', error.message);
        playMusic();
    });

    playMusic();
});

client.login(process.env.DISCORD_TOKEN);
