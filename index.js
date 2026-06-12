const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// Your specific SoundCloud Playlist
const SOUNDCLOUD_PLAYLIST = 'https://soundcloud.com/retakectrl/sets/hthn';

let playlistTracks = [];
let currentTrackIndex = 0;

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Loading the HTHN playlist...`);
    
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

    // Function to fetch the playlist tracks
    const fetchPlaylist = async () => {
        try {
            console.log("Fetching playlist data...");
            const playlist = await play.soundcloud(SOUNDCLOUD_PLAYLIST);
            playlistTracks = await playlist.all_tracks();
            console.log(`Loaded ${playlistTracks.length} tracks.`);
            return true;
        } catch (error) {
            console.error("Error fetching playlist:", error);
            return false;
        }
    };

    // Function to play the current track
    const playNextTrack = async () => {
        // If the playlist is empty or we hit the end, refetch to catch any new additions you've made, then reset the index
        if (playlistTracks.length === 0 || currentTrackIndex >= playlistTracks.length) {
            console.log("End of playlist reached or playlist empty. Refreshing playlist...");
            const success = await fetchPlaylist();
            if (!success || playlistTracks.length === 0) {
                 setTimeout(playNextTrack, 10000); // Retry in 10s if fetching fails
                 return;
            }
            currentTrackIndex = 0; // Reset to the start of the playlist
        }

        const trackToPlay = playlistTracks[currentTrackIndex];
        
        try {
            console.log(`Playing track: ${trackToPlay.name}`);
            const stream = await play.stream(trackToPlay.url);
            
            const resource = createAudioResource(stream.stream, { 
                inputType: stream.type,
                inlineVolume: true 
            });
            
            resource.volume.setVolume(0.5); // Still locked at 50%

            player.play(resource);
            connection.subscribe(player);
            
            // Increment the index so the next track plays after this one
            currentTrackIndex++;
            
        } catch (error) {
            console.error(`Error playing track ${trackToPlay.name}:`, error);
            currentTrackIndex++; // Skip the broken track and move to the next
            setTimeout(playNextTrack, 5000); 
        }
    };

    // When a track finishes, automatically trigger the next one
    player.on(AudioPlayerStatus.Idle, () => {
        playNextTrack();
    });

    player.on('error', error => {
        console.error('Audio Player Error:', error.message);
        currentTrackIndex++; // Skip the track that caused the error
        playNextTrack();
    });

    // Initial setup: Fetch the playlist, then start playing
    await fetchPlaylist();
    await playNextTrack();
});

client.login(process.env.DISCORD_TOKEN);
