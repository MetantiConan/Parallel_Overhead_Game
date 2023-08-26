precision mediump float;

uniform sampler2D tex;
uniform vec2 texture_area;
varying vec3 fragment_pos_polar;

void main()
{
	vec2 tex_pos = vec2(fragment_pos_polar.y/texture_area.x, fragment_pos_polar.z/texture_area.y);
	gl_FragColor = texture2D(tex, tex_pos);
}
