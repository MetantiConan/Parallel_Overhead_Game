
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
