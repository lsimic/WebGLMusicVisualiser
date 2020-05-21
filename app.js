import { barVertices, barIndices, initVertexArrayObject } from "./vertexarray.js"
import { barVSSource, barFSSource, initShaderProgram} from "./shader.js"

class Player {
    constructor() {
        this.barCount = undefined;
        this.barPositions = undefined;
        this.barSizes = undefined;
        this.barShaderProgram = undefined;
        this.barVertexArray = undefined;
        this.barWidthLocation = undefined;
        this.barInstancePositionsBuffer = undefined;
        this.barInstanceSizeBuffer = undefined;
        this.canvas = undefined;
        this.gl = undefined;
    }

    init() {
        this.canvas = document.querySelector("#canvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;

        this.gl = canvas.getContext("webgl2");
        if(this.gl === null) {
            alert("Unable to initialize WebGL2.");
            return;
        }

        // initialize shader and vao
        this.barShaderProgram = initShaderProgram(this.gl, barVSSource, barFSSource);
        this.barVertexArray = initVertexArrayObject(this.gl, barVertices, barIndices);

        // get bar width uniform location
        this.gl.useProgram(this.barShaderProgram);

        this.barWidthLocation = this.gl.getUniformLocation(this.barShaderProgram, "barWidth");
        // create instnce position buffer for bars and bind it to the vao.
        this.barInstancePositionsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.barInstancePositionsBuffer);
        this.gl.bindVertexArray(this.barVertexArray);
        this.gl.vertexAttribPointer(1, 1, this.gl.FLOAT, false, 1*4, 0);
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribDivisor(1, 1);

        // create instance size buffer for bars and bind it to the vao.
        this.barInstanceSizeBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.barInstanceSizeBuffer);
        this.gl.bindVertexArray(this.barVertexArray);
        this.gl.vertexAttribPointer(2, 1, this.gl.FLOAT, false, 1*4, 0);
        this.gl.enableVertexAttribArray(2);
        this.gl.vertexAttribDivisor(2, 1);

        // Call onResize to initialize barCount and position buffers...
        this.onResize(document.body.clientWidth, document.body.clientHeight);

        // clear the screen
        this.gl.clearColor(0.0, 0.0, 0.5, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    onResize(width, height) {
        // calculate appropriate number of bars
        let count = Math.trunc(width / 12); // Minimum 12px for each bar
        if(count > 256) {
            count = 256; // Cap at 256 bars
        }
        this.barCount = count;
        // Calculate barWidth in screenSpace and set uniform variable in shader
        let barWidth = (2 / count) * 0.6667; //bar width in screen space coordinates
        this.gl.uniform1f(this.barWidthLocation, barWidth);

        // Calculate bar instance positions and set the buffer
        let positions = new Float32Array(count);
        let spacing = (2 / count);
        let offset = -1 + spacing / 2;
        for(let i = 0; i<count; i++) {
            positions[i] = offset + i * spacing;
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.barInstancePositionsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);

        // Update canvas and gl viewport size
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);

    }

    render() {
        // Check if window was resized...
        // Not using resize event, to ensure that evernything the size is not changed during the drawing calls.
        // This results in perhaps a few fucky frames, but i think that is unavoidable using any method.
        //let t1 = performance.now();
        if(this.canvas.width != document.body.clientWidth || this.canvas.height != document.body.clientHeight) {
            console.log("window resized");
            this.onResize(document.body.clientWidth, document.body.clientHeight);
        }

        // TODO: get sizes for each bar from audio source instead of random generation
        let sizes = new Float32Array(this.barCount);
        for(let i = 0; i < this.barCount; i++) {
            sizes[i] = Math.random();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.barInstanceSizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, sizes, this.gl.DYNAMIC_DRAW);

        // clear the screen
        this.gl.clearColor(0.0, 0.0, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // draw the bars, instanced
        this.gl.useProgram(this.barShaderProgram);
        this.gl.bindVertexArray(this.barVertexArray);
        console.log(this.barCount);
        this.gl.drawElementsInstanced(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_INT, 0, this.barCount);
        //let t2 = performance.now();
        //console.log(t2-t1);
    }
}

let player = new Player();
player.init();
// for testing purposes
setInterval(function() {player.render()}, 1000/60);
