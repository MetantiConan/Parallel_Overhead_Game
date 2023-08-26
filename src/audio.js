//Global object to store audio data
const AudioData = {};

/**
 * Load the sound files.
 */
function init_audio()
{
	AudioData.music = new Audio("data/fast_pulse.wav");
	AudioData.move = new Audio("data/move.wav");
	AudioData.death = new Audio("data/death.wav");

	AudioData.music.loop = true;
}

/**
 * Pause or unpause the background music.
 * @param pause Whether to pause (true) or unpause (false) the music
 */
function pause_music(pause)
{
	pause ? AudioData.music.pause() : AudioData.music.play();
}

/**
 * Reset the background music to the beginning and pause it.
 */
function reset_music()
{
	AudioData.music.pause();
	AudioData.music.currentTime = 0;
}

function play_move_sound()
{
	AudioData.move.pause();
	AudioData.move.currentTime = 0;
	AudioData.move.play();
}

function play_death_sound()
{
	AudioData.death.currentTime = 0;
	AudioData.death.play();
}
