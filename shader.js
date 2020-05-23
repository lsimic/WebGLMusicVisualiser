const barVSUri = "./shaders/bar_vs.glsl";
const barFSUri ="./shaders/bar_fs.glsl";

export async function initBarShaderProgram(gl) {
    let fetchFs = await fetch(barFSUri);
    let fetchVs = await fetch(barVSUri);
    let fsData = await (await fetchFs.blob()).text();
    let vsData = await (await fetchVs.blob()).text();
    return initShaderProgram(gl, vsData, fsData);
}

function initShaderProgram(gl, vsSource, fsSource) {
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