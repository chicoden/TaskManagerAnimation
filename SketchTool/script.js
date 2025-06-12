const CELL_SIZE = 100;
const PREVIEW_HEIGHT = 100;
const CELL_COLOR = "skyblue";

let width_slider = document.getElementById("width-slider");
let height_slider = document.getElementById("height-slider");
let canvas = document.getElementById("sketch-area");
let frames_container = document.getElementById("frames-preview");

let grid_width = parseInt(width_slider.value);
let grid_height = parseInt(height_slider.value);

let ctx = canvas.getContext("2d");
canvas.width = grid_width * CELL_SIZE;
canvas.height = grid_height * CELL_SIZE;

let cur_frame = new Array(grid_height);
for (let i = 0; i < cur_frame.length; i++) {
    cur_frame[i] = new Array(grid_width).fill(false);
}

let frames = [structuredClone(cur_frame)];
let cur_frame_index = 0;
let preview_canvas = set_preview_dimensions(document.createElement("canvas"));
preview_canvas.classList.add("selected");
frames_container.appendChild(preview_canvas);

function commit_frame() {
    frames[cur_frame_index] = structuredClone(cur_frame);
    let preview_canvas = set_preview_dimensions(frames_container.children[cur_frame_index]);
    preview_canvas.getContext("2d").drawImage(canvas, 0, 0, preview_canvas.width, preview_canvas.height);
}

function insert_frame_after() {
    cur_frame = new Array(grid_height);
    for (let i = 0; i < cur_frame.length; i++) {
        cur_frame[i] = new Array(grid_width).fill(false);
    }

    frames_container.children[cur_frame_index].classList.remove("selected");
    let preview_canvas = set_preview_dimensions(document.createElement("canvas"));
    preview_canvas.classList.add("selected");
    frames_container.children[cur_frame_index].after(preview_canvas);

    frames.splice(++cur_frame_index, 0, structuredClone(cur_frame));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function insert_frame_before() {
    cur_frame = new Array(grid_height);
    for (let i = 0; i < cur_frame.length; i++) {
        cur_frame[i] = new Array(grid_width).fill(false);
    }

    frames_container.children[cur_frame_index].classList.remove("selected");
    let preview_canvas = set_preview_dimensions(document.createElement("canvas"));
    preview_canvas.classList.add("selected");
    frames_container.children[cur_frame_index].before(preview_canvas);

    frames.splice(cur_frame_index, 0, structuredClone(cur_frame));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function delete_frame() {
    if (frames.length > 1) {
        frames.splice(cur_frame_index, 1);
        frames_container.removeChild(frames_container.children[cur_frame_index]);
        if (cur_frame_index == frames.length) cur_frame_index--;
        frames_container.children[cur_frame_index].classList.add("selected");

        cur_frame = structuredClone(frames[cur_frame_index]);
        draw_frame(ctx, cur_frame);
    }
}

function save_animation() {
    let patterns = new Int64Array(frames.length);
    for (let i = 0; i < frames.length; i++) {
        let j = 0;
        for (let row of frames[i]) {
            for (let bit of row) {
                patterns[i] |= bit << j++;
            }
        }
    }

    let code = "{\n" + patterns.map((pattern) => pattern.toString(16).toUpperCase().padStart(16, "0")).join(",\n    "); + "\n}";
    navigator.clipboard.writeText(code).then(() => alert("Saved to clipboard!");
}

function set_preview_dimensions(preview_canvas) {
    preview_canvas.width = Math.floor(canvas.width / canvas.height * PREVIEW_HEIGHT);
    preview_canvas.height = PREVIEW_HEIGHT;
    return preview_canvas;
}

function set_current_frame(index) {
    if (index >= 0 && index < frames.length) {
        frames_container.children[cur_frame_index].classList.remove("selected");
        frames_container.children[index].classList.add("selected");
        cur_frame_index = index;
        cur_frame = structuredClone(frames[index]);
        draw_frame(ctx, cur_frame);
    }
}

function draw_frame(ctx, frame) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = CELL_COLOR;
    for (let y = 0; y < frame.length; y++) {
        for (let x = 0; x < frame[y].length; x++) {
            if (frame[y][x]) {
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

width_slider.addEventListener("change", function (event) {
    let old_grid_width = grid_width;
    grid_width = parseInt(event.target.value);
    if (grid_width < old_grid_width) {
        for (let i = 0; i < cur_frame.length; i++) {
            cur_frame[i] = cur_frame[i].slice(0, grid_width);
        }
    } else {
        let padding = grid_width - old_grid_width;
        for (let i = 0; i < cur_frame.length; i++) {
            for (let j = 0; j < padding; j++) {
                cur_frame[i].push(false);
            }
        }
    }

    canvas.width = grid_width * CELL_SIZE;
    draw_frame(ctx, cur_frame);
});

height_slider.addEventListener("change", function (event) {
    let old_grid_height = grid_height;
    grid_height = parseInt(event.target.value);
    if (grid_height < old_grid_height) {
        cur_frame = cur_frame.slice(0, grid_height);
    } else {
        let padding = grid_height - old_grid_height;
        for (let i = 0; i < padding; i++) {
            cur_frame.push(new Array(grid_width).fill(false));
        }
    }

    canvas.height = grid_height * CELL_SIZE;
    draw_frame(ctx, cur_frame);
});

canvas.addEventListener("mousedown", function (event) {
    let x = Math.max(0, Math.min(cur_frame[0].length - 1, Math.floor(event.offsetX / CELL_SIZE)));
    let y = Math.max(0, Math.min(cur_frame.length - 1, Math.floor(event.offsetY / CELL_SIZE)));
    if (cur_frame[y][x] = !cur_frame[y][x]) {
        ctx.fillStyle = CELL_COLOR;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    } else {
        ctx.clearRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
});

window.addEventListener("keydown", function (event) {
    switch (event.key) {
        case "ArrowLeft":
            event.preventDefault();
            set_current_frame(cur_frame_index - 1);
            break;

        case "ArrowRight":
            event.preventDefault();
            set_current_frame(cur_frame_index + 1);
            break;

        case "Enter":
            event.preventDefault();
            if (!event.repeat) commit_frame();
            break;

        case "]":
            event.preventDefault();
            if (!event.repeat) insert_frame_after();
            break;

        case "[":
            event.preventDefault();
            if (!event.repeat) insert_frame_before();
            break;

        case "-":
            event.preventDefault();
            if (!event.repeat) delete_frame();
            break;

        case "z":
            if (event.ctrlKey) {
                event.preventDefault();
                if (!event.repeat) console.log("undo");
            } break;

        case "Z":
            if (event.ctrlKey) {
                event.preventDefault();
                if (!event.repeat) console.log("redo");
            } break;

        case "s":
            if (event.ctrlKey) {
                event.preventDefault();
                if (!event.repeat) save_animation();
            } break;
    }
});