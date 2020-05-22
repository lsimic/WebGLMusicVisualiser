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
        this.barColorLocation = undefined;
        this.barInstancePositionsBuffer = undefined;
        this.barInstanceSizeBuffer = undefined;

        this.canvas = undefined;
        this.gl = undefined;

        this.audioCtx = undefined;
        this.audioAnalyser = undefined;
        this.audio = undefined;
        this.interval = undefined;

        this.progressBarBackground = undefined;
        this.progressBar = undefined;
        this.timer = undefined;
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

        // get bar width and color uniform location
        this.gl.useProgram(this.barShaderProgram);

        this.barWidthLocation = this.gl.getUniformLocation(this.barShaderProgram, "barWidth");
        this.barColorLocation = this.gl.getUniformLocation(this.barShaderProgram, "aColor");
        // bind barColor to default value
        this.gl.uniform3fv(this.barColorLocation, new Float32Array([0.608, 0.953, 0.941]));
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
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // set audio element
        this.audio = document.querySelector("#player");
        this.audio.pause();

        // set progress bar elements
        this.progressBar = document.querySelector("#progress-bar");
        this.progressBarBackground = document.querySelector("#progress-bar-bg");
        this.timer = document.querySelector("#timer");
        
        // set progress bar events
        this.boundOnProgressMouseMove = e => this.onProgressMouseMove(e);
        this.progressBarBackground.addEventListener("mousedown", e => this.onProgressMouseDown(e));
        this.progressBarBackground.addEventListener("mouseup", e => this.onProgressMouseUp(e));
    }

    onProgressMouseDown(e) {
        // pause animation and playback
        this.onPause();
        // set progress bar width
        this.progressBarBackground.addEventListener("mousemove", this.boundOnProgressMouseMove);
    }

    onProgressMouseMove(e) {
        // update the bar width to mouse position
        this.progressBar.style.width = ((e.clientX / document.body.clientWidth)*100).toString() + "%";
        this.updateTimer(this.audio.duration * (e.clientX / document.body.clientWidth))
    }

    onProgressMouseUp(e) {
        // set current time on audio
        if(this.audio.currentTime && this.audio.duration) {
            this.audio.currentTime = (e.clientX / document.body.clientWidth) * this.audio.duration;
            this.onPlay();
        }
        else {
            this.progressBar.style.width = "0%";
        }
        //remove mouse move event
        this.progressBarBackground.removeEventListener("mousemove", this.boundOnProgressMouseMove);
    }

    onResize(width, height) {
        // calculate appropriate number of bars
        // since fftSize must be a power if 2 between 2^5 and 2^15
        // number of bars should be a power of 2 between 2^4 and 2^14
        let count = Math.trunc(width / 8); // Minimum 8px for each bar
        count = Math.pow(2, Math.round(Math.log2(count)))
        if(count < 16) {
            count = 16; // min 16 bars(fftSize = 32)
        }
        else if(count > 2048) {
            count = 2048; // max 2048 bars(fftSize = 4096), unlikely
        }
        this.barCount = count;
        // Calculate barWidth in screenSpace and set uniform variable in shader
        let barWidth = (2 / count) * 0.3333; //bar width in screen space coordinates
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
            this.onResize(document.body.clientWidth, document.body.clientHeight);
        }

        // get height values from analyser node.
        this.audioAnalyser.fftSize = 2 * this.barCount;
        let sizes = new Float32Array(this.barCount);
        this.audioAnalyser.getFloatTimeDomainData(sizes);
        // populate the buffer with the data
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.barInstanceSizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, sizes, this.gl.DYNAMIC_DRAW);

        // clear the screen
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // draw the bars, instanced
        this.gl.useProgram(this.barShaderProgram);
        this.gl.bindVertexArray(this.barVertexArray);
        this.gl.drawElementsInstanced(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_INT, 0, this.barCount);
        //let t2 = performance.now();
        //console.log(t2-t1);

        // update the progress bar width...
        this.progressBar.style.width = ((this.audio.currentTime / this.audio.duration) * 100).toString() + "%";

        // update the timer
        this.updateTimer(this.audio.currentTime);
    }

    onPlay() {
        document.querySelector("#player-controls #play").style.display = "none";
        document.querySelector("#player-controls #pause").style.display = "inline-block";

        // Create audio context and analyser
        this.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        this.audioAnalyser = this.audioCtx.createAnalyser();
        // Set up the audio stream
        let stream = undefined;
        if(this.audio.captureStream) {
            stream = this.audio.captureStream();
        }
        else {
            stream = this.audio.mozCaptureStream();
        }
        let aduioSource = this.audioCtx.createMediaStreamSource(stream)
        aduioSource.connect(this.audioAnalyser);

        // start playing audio
        this.audio.play();

        // set up event for onPause function when audio ends
        var t = this;
        this.audio.addEventListener("ended", function() {
            t.onPause(); 
            document.querySelector("#player-controls #play").style.display = "inline-block";
            document.querySelector("#player-controls #pause").style.display = "none";
        });

        // set the interval and start rendering
        this.interval = setInterval(function() {t.render();}, 1000/60);
    }

    onPause() {
        document.querySelector("#player-controls #play").style.display = "inline-block";
        document.querySelector("#player-controls #pause").style.display = "none";
        // stop the audio
        this.audio.pause();
        // stop the interval
        clearInterval(this.interval);
        this.interval = undefined;
    }

    updateTimer(currentTime) {
        let minutes = Math.trunc(this.audio.duration/60);
        let seconds = this.audio.duration - (60 * minutes);
        let currentMinutes = Math.trunc(currentTime/60);
        let currentSeconds = currentTime - (60 * currentMinutes);
        let text = "";
        if(currentSeconds <= 10) {
            text = currentMinutes.toString() + ":0" + Math.trunc(currentSeconds) + "/";
        }
        else {
            text = currentMinutes.toString() + ":" + Math.trunc(currentSeconds) + "/";
        }
        if(seconds <= 10) {
            text = text + minutes.toString() + ":0" + Math.trunc(seconds);
        }
        else {
            text = text + minutes.toString() + ":" + Math.trunc(seconds);
        }
        this.timer.innerHTML = text;
    }

    onColorChange(e) {
        let hex = e.target.value;
        document.querySelector("#overlay").style.color = hex;
        this.progressBar.style.backgroundColor = hex;
        this.progressBarBackground.style.borderColor = hex;

        // change color uniform value in the shader
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        let r = parseInt(result[1], 16)/255;
        let g = parseInt(result[2], 16)/255;
        let b = parseInt(result[3], 16)/255;
        this.gl.useProgram(this.barShaderProgram);
        this.gl.uniform3fv(this.barColorLocation, new Float32Array([r, g, b]));
    }
}

let player = new Player();
player.init();

//event listeners for buttons
document.querySelector("#player-controls #play").addEventListener("click", function() {
    player.onPlay();
});
document.querySelector("#player-controls #pause").addEventListener("click", function() {
    player.onPause();
});
document.querySelector("#source").addEventListener("change", function(e) {
    player.audio.src = window.URL.createObjectURL(this.files[0]);
    document.querySelector("#title").innerHTML = this.files[0].name;

    player.audio.addEventListener("loadedmetadata", function(e) {
        let minutes = Math.trunc(e.target.duration/60);
        let seconds = e.target.duration - (60 * minutes);
        let text = "";
        if(seconds <= 10) {
            text = "0:00/" + minutes.toString() + ":0" + Math.trunc(seconds);
        }
        else {
            text = "0:00/" + minutes.toString() + ":" + Math.trunc(seconds);
        }
        document.querySelector("#timer").innerHTML = text;
    });

    player.onPause();
});
document.querySelector("#bg-img").addEventListener("change", function(e) {
    document.body.style.backgroundImage = "url(" + window.URL.createObjectURL(this.files[0]) + ")";
});
document.querySelector("#color").addEventListener("change", function(e) {
    player.onColorChange(e);
});
