const CELL_SIZE = 100;
const PREVIEW_HEIGHT = 100;

let width_slider = document.getElementById("width-slider");
let height_slider = document.getElementById("height-slider");
let canvas = document.getElementById("sketch-area");
let frames_container = document.getElementById("frames-preview");

canvas.width = width_slider.value * CELL_SIZE;
canvas.height = height_slider.value * CELL_SIZE;
let frames = [[]];
let cur_frame = 0;

let minicanvas = document.createElement("canvas");
minicanvas.width = Math.floor(canvas.width / canvas.height * PREVIEW_HEIGHT);
minicanvas.height = PREVIEW_HEIGHT;
minicanvas.getContext("2d").drawImage(canvas, 0, 0, minicanvas.width, minicanvas.height);
frames_container.appendChild(minicanvas);