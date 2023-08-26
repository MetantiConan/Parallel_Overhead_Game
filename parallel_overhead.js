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

//Global object for holding the number graphics and data.
const HUD =
{
	widths: [7, 3, 7, 7, 7, 7, 7, 7, 7, 7, 3, 3],
	positions: []
}

/**
 * Render the given number to the given position in the HUD canvas.
 * @param num The number to render.
 * @param x The x-coordinate to render at.
 * @param y The y-coordinate to render at.
 */
function render_number(num, x, y)
{
	const w = HUD.widths[num];
	HUD.context.drawImage(HUD.nums, HUD.positions[num], 0, w, 11, x, y, w, 11);
	return w + 1;
}

/**
 * Format and render the given time to the HUD canvas.
 * @param y The y-coordinate in the canvas to render at.
 * @param time_ms The time to render in milliseconds.
 */
function render_time(y, time_ms)
{
	let m = time_ms/60000;
	let s = (time_ms/1000) % 60;
	let ms = time_ms % 1000;

	if (m > 99)
	{
		m = 99;
		s = 99;
		ms = 999;
	}

	let render_nums = [];

	render_nums[0] = m / 10;
	render_nums[1] = m % 10;
	render_nums[2] = 10; //:
	render_nums[3] = s / 10;
	render_nums[4] = s % 10;
	render_nums[5] = 11; //.
	render_nums[6] = ms / 100;
	render_nums[7] = (ms % 100) / 10;
	render_nums[8] = ms % 10;

	render_nums = render_nums.map(x => Math.floor(x));

	let cut = 0;
	if (!render_nums[0])
	{
		cut = 1;
		if (!render_nums[1])
		{
			cut = 3;
			if (!render_nums[3])
			{
				cut = 4;
			}
		}
	}

	let x = 0;
	for (let i = cut; i < 9; i++)
	{
		const num = render_nums[i];
		x += render_number(num, x, y);
	}
}

/**
 * Render the given number to the HUD canvas.
 * @param y The y-coordinate in the canvas to render at.
 * @param distance The number to render.
 */
function render_distance(y, distance)
{
	if (distance > 9999999)
	{
		distance = 9999999;
	}

	let x = 0;
	let leading = 1;
	for (let i = 7; i > 0; i--)
	{
		const num = Math.floor((distance % 10**(i+1)) / 10**i);
		if (leading && !num)
		{
			continue;
		}
		leading = 0;
		x += render_number(num, x, y);
	}

	render_number(distance % 10, x, y);
}

/**
 * Render the given time and distance to the HUD canvas.
 * @param time_ms The time to render in milliseconds.
 * @param distance The distance to render.
 */
function render_time_and_distance(time_ms, distance)
{
	HUD.context.clearRect(0,0, HUD.canvas.width, HUD.canvas.height);

	render_time(0, time_ms);
	render_distance(12, distance);
}

/**
 * Initialize the HUD system to use the given canvas and number graphics.
 * @param canvas The canvas the HUD is to be rendered to.
 * @param nums_image The image with the number graphics.
 */
function init_hud(canvas, nums_image)
{
	HUD.nums = nums_image;
	HUD.canvas = canvas;
	HUD.context = canvas.getContext("2d");
	HUD.context.translate(canvas.width, 0);
	HUD.context.scale(-1,1);

	let x = 0;
	for (let w of HUD.widths)
	{
		HUD.positions.push(x);
		x += w;
	}
}

const FULL_ANGLE = 2 * Math.PI;
const Events = [], Textures = [];
let HUDCanvas;

function init_game(resources)
{
	ErrorDiv.innerText = "Initializing the game...";
	const sector_angle = FULL_ANGLE/Settings.game.sectors;
	const vertices = new Float32Array((4 + 2*Settings.game.sectors + 2)*3);

	//Ship vertices
	vertices[0] = 1;
	vertices[1] = 0;
	vertices[2] = 0;

	vertices[3] = 1;
	vertices[4] = 0;
	vertices[5] = sector_angle;

	vertices[6] = 1;
	vertices[7] = sector_angle;
	vertices[8] = 0;

	vertices[9] = 1;
	vertices[10] = sector_angle;
	vertices[11] = sector_angle;

	//Wall vertices
	for (let i = 0; i <= Settings.game.sectors; i++)
	{
		const pos = 12 + i * 6;
		const angle = i * sector_angle;

		vertices[pos + 0] = 1;
		vertices[pos + 1] = angle;
		vertices[pos + 2] = 0;
		vertices[pos + 3] = 1;
		vertices[pos + 4] = angle;
		vertices[pos + 5] = Settings.game.rings;
	}

	const vertex_buffer = GL.createBuffer();
	GL.bindBuffer(GL.ARRAY_BUFFER, vertex_buffer);

	GL.bufferData(GL.ARRAY_BUFFER, vertices, GL.STATIC_DRAW);

	const ship_texture = GL.createTexture();
	const wall_texture = GL.createTexture();
	const timer_texture = GL.createTexture();
	Textures.push(ship_texture, wall_texture, timer_texture);

	//Ship texture
	const ship_image = resources[2];

	GL.bindTexture(GL.TEXTURE_2D, ship_texture);
	set_tex_paremeters();
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, ship_image);

	//Timer
	HUDCanvas = document.createElement("canvas");
	HUDCanvas.width = 7*7+2*3+7*1;
	HUDCanvas.height = 2*11+1;

	init_hud(HUDCanvas, resources[3]);
	GL.bindTexture(GL.TEXTURE_2D, timer_texture);
	set_tex_paremeters();

	//Misc
	GL.clearColor(0,0,0,1);

	const w = innerWidth;
	const h = innerHeight;
	Canvas.width = w;
	Canvas.height = h;
	GL.uniform2f(Locs.screen_wh, w, h);
	GL.viewport(0,0,w,h);

	GL.vertexAttribPointer(Locs.vertex_pos_polar, 3, GL.FLOAT, GL.FALSE, 0, 0);
	GL.enableVertexAttribArray(Locs.vertex_pos_polar);

	//Wall texture
	GL.bindTexture(GL.TEXTURE_2D, wall_texture);
	set_tex_paremeters();


	if (report_GL_errors("Initializing the game"))
	{
		return;
	}

	addEventListener("keydown", push_event);
	addEventListener("mousedown", push_event);
	addEventListener("resize", push_event);
	function push_event(e)
	{
		Events.push(e);
	}

	run_game();
}

/**
 * Set the texture parameters used by all textures for the currently bound TEXTURE_2D.
 */
function set_tex_paremeters()
{
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
	GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
}

function init_GL(resources)
{
	ErrorDiv.innerText = "Preparing the WebGL program...";

	const program = make_program(resources[0], resources[1]);
	if (!program)
	{
		ErrorDiv.innerText = "Preparing the WebGL program failed.";
		return;
	}

	GL.useProgram(program);

	GL.enable(GL.BLEND);
	GL.blendFuncSeparate(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA);

	Locs.vertex_pos_polar = GL.getAttribLocation(program, "vertex_pos_polar");
	Locs.screen_wh = GL.getUniformLocation(program, "screen_wh");
	Locs.object_pos_polar = GL.getUniformLocation(program, "object_pos_polar");
	Locs.texture_area = GL.getUniformLocation(program, "texture_area");

	if (report_GL_errors("Initialize WebGL"))
	{
		return;
	}

	init_game(resources);
}

function make_program(vertex_shader_source, fragment_shader_source)
{
	const vertex_shader = make_shader(vertex_shader_source, GL.VERTEX_SHADER);
	if (!vertex_shader)
	{
		return;
	}

	const fragment_shader = make_shader(fragment_shader_source, GL.FRAGMENT_SHADER);
	if (!fragment_shader)
	{
		return;
	}

	const program = GL.createProgram();
	GL.attachShader(program, vertex_shader);
	GL.attachShader(program, fragment_shader);
	GL.linkProgram(program);

	if (GL.getProgramParameter(program, GL.LINK_STATUS))
	{
		return program;
	}

	console.log(GL.getProgramInfoLog(program));
	report_GL_errors("Linking program");
}

function make_shader(source, type)
{
	const shader = GL.createShader(type);
	GL.shaderSource(shader, source);
	GL.compileShader(shader);

	if (GL.getShaderParameter(shader, GL.COMPILE_STATUS))
	{
		return shader;
	}

	console.log(GL.getShaderInfoLog(shader));
	report_GL_errors("Compiling shader");
}

function report_GL_errors(context)
{
	let amount = -1;
	let err;
	do
	{
		err = GL.getError();
		amount++;
	}
	while (err != GL.NO_ERROR);

	if (amount)
	{
		const msg =  context + ": " + amount + " WebGL error(s) encountered.";
		ErrorDiv.innerText = msg;
		console.err(msg);
	}

	return amount;
}

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

let GL, Canvas, ErrorDiv;
const Locs = {};

onload = function()
{
	ErrorDiv = document.getElementById("error");

	Canvas = document.getElementById("game-canvas");
	GL = Canvas.getContext("webgl");
	if (!GL)
	{
		ErrorDiv = document.getElementById("No WebGL context received.");
	}

	ErrorDiv.innerText = "Loading resources...";
	text = r => r.ok ? r.text() : Promise.reject(r);
	image = r => r.ok ? r.blob().then(b => createImageBitmap(b)) : Promise.reject(r);
	const resource_promises =
	[
		fetch("data/vertex.glsl").then(text),
		fetch("data/fragment.glsl").then(text),
		fetch("data/ship.bmp").then(image),
		fetch("data/nums.bmp").then(image),
	];

	init_audio();

	Promise.all(resource_promises).then(init_GL, report_resource_error);
}

function report_resource_error(error)
{
	ErrorDiv.innerText = "Loading resources failed.";
	console.error(error);
}

function run_game()
{
	const ship_texture = Textures[0];
	const wall_texture = Textures[1];
	const timer_texture = Textures[2];
	const sector_angle = FULL_ANGLE/Settings.game.sectors;

	reset_level();
	reset_music();

	const ships = [];
	for (let i = 0; i < Settings.game.ships; i++)
	{
		ships[i] = {};
		ships[i].alive = 1;
		ships[i].sector = Settings.game.start_sector + i * (Settings.game.sectors / Settings.game.ships);
	}

	//Wall texture
	GL.bindTexture(GL.TEXTURE_2D, wall_texture);
	const wall_texture_data = new Uint8Array((Settings.game.rings + Settings.game.color_transitions.max) * Settings.game.sectors * 4);
	let rings_generated = generate_rings(wall_texture_data);
	while (rings_generated < Settings.game.rings)
	{
		rings_generated += generate_rings
		(
			wall_texture_data, rings_generated * Settings.game.sectors * 4
		);
	}
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, Settings.game.sectors, Settings.game.rings, 0, GL.RGBA, GL.UNSIGNED_BYTE, wall_texture_data);

	let ship_ring = 0;
	let last_tick_start_time = 0;
	let time_survived = 0;
	let rings_survived = 0;
	let paused = 1;
	let ships_alive = Settings.game.ships;

	ErrorDiv.innerText = "";
	console.log("Starting a new run.\n");

	requestAnimationFrame(frame);
	function frame(tick_start_time)
	{
		last_tick_time = Math.min(tick_start_time - last_tick_start_time, Settings.tick_time.max);

		let w,h, ship_sector_delta = 0;
		let e;
		while (e = Events.pop())
		{
			switch (e.type)
			{
				case "resize":
					const w = innerWidth;
					const h = innerHeight;
					Canvas.width = w;
					Canvas.height = h;
					GL.uniform2f(Locs.screen_wh, w, h);
					GL.viewport(0,0,w,h);
					break;
				case "keydown":
					if (e.repeat)
					{
						break;
					}
					switch (e.key)
					{
						case "ArrowRight":
							ship_sector_delta++;
							break;
						case "ArrowLeft":
							ship_sector_delta--;
							break;
						case " ":
						case "Enter":
							paused = !paused;
							if (ships_alive)
							{
								break;
							}
						case "Escape":
						case "Backspace":
							setTimeout(run_game);
							return;
					}
					break;
				case "mousedown":
					if (e.button)
					{
						break;
					}
					const x = e.clientX;
					const qw = innerWidth/4;

					if (x < qw)
					{
						ship_sector_delta--;
						break;
					}
					if (x > 3*qw)
					{
						ship_sector_delta++;
						break;
					}

					paused = !paused;
					if (ships_alive)
					{
						break;
					}
					setTimeout(run_game);
					return;
			}
		}

		const speed = Math.sqrt(time_survived)*Settings.difficulty.speed;

		if (paused || !ships_alive)
		{
			ship_sector_delta = 0;
			pause_music(1);
		}
		else
		{
			time_survived += last_tick_time;
			ship_ring += last_tick_time*speed;
			pause_music(0);
		}

		GL.clear(GL.COLOR_BUFFER_BIT);

		//Update and render walls
		GL.bindTexture(GL.TEXTURE_2D, wall_texture);
		while(ship_ring > 1)
		{
			const a = wall_texture_data.copyWithin(0, Settings.game.sectors * 4);
			console.assert(a === wall_texture_data);
			rings_generated--;
			ship_ring--;
			rings_survived++;

			while (rings_generated < Settings.game.rings)
			{
				rings_generated += generate_rings
				(
					wall_texture_data, rings_generated * Settings.game.sectors * 4
				);
			}

			GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, Settings.game.sectors, Settings.game.rings, 0, GL.RGBA, GL.UNSIGNED_BYTE, wall_texture_data);
		}

		GL.uniform3f(Locs.object_pos_polar, 0, 0, -ship_ring);
		GL.uniform2f(Locs.texture_area, FULL_ANGLE,  Settings.game.rings);
		GL.drawArrays(GL.TRIANGLE_STRIP, 4, (2*Settings.game.sectors + 2));

		//Update and render ships
		GL.bindTexture(GL.TEXTURE_2D, ship_texture);
		GL.uniform2f(Locs.texture_area, sector_angle, sector_angle);

		if (ship_sector_delta)
		{
			play_move_sound();
		}

		ships_alive = 0;
		for (let i = 0; i < Settings.game.ships; i++)
		{
			if (ships[i].alive)
			{
				ships[i].sector += ship_sector_delta;
				ships[i].sector %= Settings.game.sectors;
				if (ships[i].sector < 0)
				{
					ships[i].sector += Settings.game.sectors;
				}

				if (!wall_texture_data[Settings.game.sectors*4*Settings.game.ship_depth + ships[i].sector*4 + 3])
				{
					ships[i].alive = 0;
					increase_difficulty();
					play_death_sound();
					console.log("Ship lost after " + time_survived/1000. + " s (a distance of " + rings_survived + " rings).\n");
					continue;
				}

				ships_alive++;

				GL.uniform3f(Locs.object_pos_polar, 0, ships[i].sector * sector_angle, Settings.game.ship_depth);
				GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);
			}
		}

		//Render timer
		render_time_and_distance(time_survived, rings_survived);
		GL.bindTexture(GL.TEXTURE_2D, timer_texture);
		GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, HUDCanvas);

		GL.uniform3f(Locs.object_pos_polar, 1, Settings.hud.sector * sector_angle, Settings.hud.depth);
		GL.uniform2f(Locs.texture_area, sector_angle, sector_angle);
		GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);

		requestAnimationFrame(frame);
	}
}

Settings =
{
	game:
	{
		rings:200, sectors:10, ships:2, ship_depth:1, start_sector:2,
		color_transitions: {min:12, max:60}
	},
	difficulty:
	{
		speed:0.000075, uncarved_safe_chance:0.5, carvers:2, transition_length:8,
		increase: {speed:0, uncarved_safe_chance:-0.25, carvers:-1, transition_length:0}
	},
	hud: {sector:2, depth:3},
	tick_time: {max: 24}
}
