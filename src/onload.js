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
