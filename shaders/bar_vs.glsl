#version 300 es
layout (location = 0) in vec2 aPos;
layout (location = 1) in float aOffset;
layout (location = 2) in float aScale;
uniform float barWidth;
void main()
{
    float maxYSize = 0.333;
    float yOffset = -0.666;
    gl_Position = vec4(aPos[0]*barWidth+aOffset, aPos[1]*abs(aScale)*maxYSize+yOffset, 0.0, 1.0);
}