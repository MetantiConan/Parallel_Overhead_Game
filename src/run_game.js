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
