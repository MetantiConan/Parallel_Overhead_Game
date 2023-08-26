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
