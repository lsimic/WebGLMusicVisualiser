export const barVSSource =
"#version 300 es\r\n" +
"layout (location = 0) in vec2 aPos;\r\n" +
"layout (location = 1) in float aOffset;\r\n" +
"layout (location = 2) in float aScale;\r\n" +
"uniform float barWidth;\r\n" +
"void main()\r\n" +
"{\r\n" +
"    float maxYSize = 0.333;\r\n" +
"    float yOffset = -0.666;\r\n" +
"    gl_Position = vec4(aPos[0]*barWidth+aOffset, aPos[1]*abs(aScale)*maxYSize+yOffset, 0.0, 1.0);\r\n" +
"}";

export const barFSSource =
"#version 300 es\r\n" +
"precision mediump float;\r\n" +
"uniform vec3 aColor;\r\n" +
"out vec4 fragColor;\r\n" +
"void main()\r\n" +
"{\r\n" +
"    fragColor = vec4(aColor[0], aColor[1], aColor[2], 1.0f);\r\n" +
"}\r\n";

export function initShaderProgram(gl, vsSource, fsSource) {
    // Vertex Shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    // Fragment Shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    // Shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Delete shaders after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return shaderProgram;
}