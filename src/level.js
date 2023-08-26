const Level =
{
	previous_color: [],
	carvers: [],
	safe_path: [],
	carvers_to_merge: 0,
	difficulty:
	{
		uncarved_safe_chance: 0,
		carvers: 0,
		transition_length: 0
	}
};

/**
 * @return A random number in the range [0,1[
 */
function ranf()
{
	return Math.random()
}

/**
 * @return A random number in the range [min,max[
 */
function ranfi(min, max)
{
	return min + Math.random() * ( max - min );
}

/**
 * @return A random integer in the range [min,max]
 */
function rani(min, max)
{
	return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Shuffle an array.
 * @param array The array to shuffle
 * @param len The length of the array
 */
function shuffle(array, len)
{
	for (let i = 0; i < len; i++)
	{
		const j = rani(0,i);
		const tmp = array[i];
		array[i] = array[j];
		array[j] = tmp;
	}
}

/**
 * Generate a random bright color.
 * @param color The 3-cell float array to store the generated color in.
 */
function generate_color(color)
{
	color[0] = 0;
	color[1] = 255;
	color[2] = rani(0,255);
	shuffle(color, 3);
}

/**
 * Reset the level generator (for starting a new game).
 */
function reset_level()
{
	generate_color(Level.previous_color);

	for (let i = 0; i < Settings.difficulty.carvers; i++)
	{
		Level.carvers[i] = rani(0, (Settings.game.sectors / Settings.game.ships) - 1);
	}

	Level.carvers_to_merge = 0;
	Level.difficulty.carvers = Settings.difficulty.carvers;

	Level.difficulty.uncarved_safe_chance = Settings.difficulty.uncarved_safe_chance;
	Level.difficulty.transition_length = Settings.difficulty.transition_length;

	for (let i = 0; i < Settings.game.sectors; i++)
	{
		Level.safe_path[i] = Level.difficulty.transition_length;
	}
}

/**
 * Increse the difficulty of the generated level by an amount defined in the settings.
 */
function increase_difficulty()
{
	Level.difficulty.uncarved_safe_chance += Settings.difficulty.increase.uncarved_safe_chance;
	Level.difficulty.transition_length += Settings.difficulty.increase.transition_length;

	Level.carvers_to_merge -= Settings.difficulty.increase.carvers;
}

/**
 * Add a section of rings to the given texture array.
 * @param colors The texture array to add the rings to
 * @return The amount of rings added
 */
function generate_rings(colors, offset = 0)
{
	const last_carver = Level.difficulty.carvers - 1;
	const sectors_per_ship = (Settings.game.sectors / Settings.game.ships);

	const length = rani(Settings.game.color_transitions.min, Settings.game.color_transitions.max);

	const color = Array.from(Level.previous_color);

	const next_color = [];
	generate_color(next_color);
	Level.previous_color = next_color;

	const rstep = (next_color[0] - color[0]) / length;
	const gstep = (next_color[1] - color[1]) / length;
	const bstep = (next_color[2] - color[2]) / length;

	//For each generated ring
	for (let r = 0; r < length; r++)
	{
		//For each active carver
		for (let c = 0; c < Level.difficulty.carvers; c++)
		{
			//Carve a safe path
			for (let s = 0; s < Settings.game.ships; s++)
			{
				const sector = Level.carvers[c] + s * sectors_per_ship;
				Level.safe_path[sector] = Level.difficulty.transition_length + 1;
			}

			//Move the carver randomly
			let sector = (Level.carvers[c] + rani(-1,1)) % sectors_per_ship;
			if (sector < 0)
			{
				sector += sectors_per_ship;
			}
			Level.carvers[c] = sector;

			//Merge the last carver into this one if requested (difficulty increase) and possible (same place)
			if (Level.carvers_to_merge && c != last_carver && Level.carvers[c] == Level.carvers[last_carver])
			{
				Level.difficulty.carvers--;
				Level.carvers_to_merge--;
			}
		}

		color[0] += rstep;
		color[1] += gstep;
		color[2] += bstep;
		for (let s = 0; s < Settings.game.sectors; s++)
		{
			const pos = offset + (r * Settings.game.sectors + s) * 4;

			colors[pos + 0] = color[0];
			colors[pos + 1] = color[1];
			colors[pos + 2] = color[2];
			colors[pos + 3] = rani(153,255);

			if (Level.safe_path[s])
			{
				Level.safe_path[s]--;
			}
			else if (ranf() > Level.difficulty.uncarved_safe_chance)
			{
				colors[pos + 3] = 0;
			}
		}
	}
	return length;
}
