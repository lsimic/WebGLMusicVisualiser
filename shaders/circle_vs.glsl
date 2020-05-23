#version 300 es
layout (location = 0) in vec2 aPos;
layout (location = 1) in float aRotation;
layout (location = 2) in float aScale;
uniform float barWidth;
uniform float ratio;
void main()
{
    float maxYSize = 0.333;
    float yOffset = 0.333;
    vec2 temp = vec2(aPos[0]*barWidth, aPos[1]*abs(aScale)*maxYSize+yOffset);
    gl_Position = vec4((temp[0]*cos(aRotation) - temp[1]*sin(aRotation))*ratio, temp[0]*sin(aRotation) + temp[1]*cos(aRotation) + yOffset, 0.0, 1.0);
}