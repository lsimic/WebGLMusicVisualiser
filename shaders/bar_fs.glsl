#version 300 es
precision mediump float;
uniform vec3 aColor;
out vec4 fragColor;
void main()
{
    fragColor = vec4(aColor[0], aColor[1], aColor[2], 1.0f);
}