precision mediump float;

attribute vec3 vertex_pos_polar;
uniform vec2 screen_wh;
uniform vec3 object_pos_polar;
varying vec3 fragment_pos_polar;

void main()
{
	vec3 pos = vertex_pos_polar + object_pos_polar;
	float ratio = sqrt(screen_wh.x/screen_wh.y);

	gl_Position = vec4(cos(pos.y)*pos.x/ratio, sin(pos.y)*pos.x*ratio, pos.z, pos.z);
	fragment_pos_polar = vertex_pos_polar;
}
