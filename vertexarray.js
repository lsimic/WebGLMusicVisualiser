export const barVertices = new Float32Array([
    0.5, 1.0,  // top right
    0.5, 0.0,  // bottom right
    -0.5, 0.0, // bottom left
    -0.5, 1.0  // top left
]);

export const barIndices = new Uint32Array([
    0, 1, 3,
    1, 2, 3
]);

export function initVertexArrayObject(gl, vertices, indices) {
    // Create VAO
    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);

    // Create, bind and populate vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Create, bind and populte element buffer
    const elementBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Link position vertex attribute (index 0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
    gl.enableVertexAttribArray(0);
    return vertexArray;
}