var VSHADER_SOURCE =
  'attribute vec4 aVertexPosition;\n' +
  'attribute vec2 aTextureCoordinates;\n' +
  'uniform mat4 uTransformMatrix;\n' +
  'uniform mat4 uPerspectiveViewMatrix;\n' +
  'varying vec2 vTextureCoordinates;\n' +
  'void main() {\n' +
  '  gl_Position = uPerspectiveViewMatrix * uTransformMatrix * aVertexPosition;\n' +
  '  vTextureCoordinates = aTextureCoordinates;\n' +
  '}\n';
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 vTextureCoordinates;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, vTextureCoordinates);\n' +
  '}\n';

var gl;
var canvas;
var vertexPositionAttributePointer;
var textureCoordinatesAttributePointer;

var transformUniformPointer;
var perspectiveViewUniformPointer;

var vertexBuffer;
var indexBuffer;

var samplerUniformPointer;

var floorVBuffer; // Vertex - floor
var floorIBuffer; //Index - floor

var textureBuffer;
var faceTextureBuffer;
var bodyTextureBuffer;

var bodyTexture; //texture - body
var skyboxTexture; //texture - sky
var faceTexture; //texture - face
var floorTexture; //texture - floor

var totalAngle = 0;
var cameraDistance = 10;
var requestId = 0;

var previousTime;
var currentTime;

var mouseDown = false; // flag from when mouse is down
var deltaFresh = false;
var lastMouseX = null; // last position of the mouse in the canvas
var lastMouseY = null;
var currMouseX = null; // current position of the mouse in the canvas
var currMouseY = null;
var deltaMouseX = 0; // current - last mouse position
var deltaMouseY = 0;
var rect;

function initShader(gl, VSHADER_SOURCE, FSHADER_SOURCE) {
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  vertexPositionAttributePointer = gl.getAttribLocation(gl.program, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttributePointer);
  textureCoordinatesAttributePointer = gl.getAttribLocation(gl.program,'aTextureCoordinates');
  gl.enableVertexAttribArray(textureCoordinatesAttributePointer);
  transformUniformPointer = gl.getUniformLocation(gl.program,'uTransformMatrix');
   perspectiveViewUniformPointer = gl.getUniformLocation(gl.program,'uPerspectiveViewMatrix');
  samplerUniformPointer = gl.getUniformLocation(gl.program, 'u_Sampler');
}

function loadImageForTexture(url, textureObject) {
  var image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, textureObject);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  image.src = url;
}

function initBuffers() {
  var cubeVertices = [
    // top
    -1, -1,  1, 1,
    1, -1,  1, 1,
    1,  1,  1, 1,
    -1,  1,  1, 1,
    // bottom
    -1, -1, -1, 1,
    -1,  1, -1, 1,
    1,  1, -1, 1,
    1, -1, -1, 1,
    // left
    -1,  1, -1, 1,
    -1,  1,  1, 1,
    1,  1,  1, 1,
    1,  1, -1, 1,
    // right
    -1, -1, -1, 1,
    1, -1, -1, 1,
    1, -1,  1, 1,
    -1, -1,  1, 1,
    // front
    1, -1, -1, 1,
    1,  1, -1, 1,
    1,  1,  1, 1,
    1, -1,  1, 1,
    // back
    -1, -1, -1, 1,
    -1, -1,  1, 1,
    -1,  1,  1, 1,
    -1,  1, -1, 1
  ];
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);
  vertexBuffer.itemSize = 4;
  vertexBuffer.numberOfItems = 24;

  indexBuffer = gl.createBuffer();
  var indexMatrix = [
    // top
    0,   1,  2,
    0,   2,  3,  
    // bottom
    4,   5,  6,
    4,   6,  7,  
    // left
    8,   9, 10,
    8,  10, 11,  
    // right
    12, 13, 14,
    12, 14, 15,  
    // front
    16, 17, 18,
    16, 18, 19,  
    // back
    20, 21, 22,
    20, 22, 23
  ];  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexMatrix), gl.STATIC_DRAW);
  indexBuffer.itemSize = 1;
  indexBuffer.numberOfItems = 36;

  floorVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVBuffer);
  var floorVMatrix = [
    -1.0, -1.0, -1.0, 1.0,
    1.0, -1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    1.0,  1.0, -1.0, 1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVMatrix),	gl.STATIC_DRAW);
  floorVBuffer.itemSize = 4;
  floorVBuffer.numberOfItems = 4;

  floorIBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIBuffer);
  var floorIMatrix = [
    0, 1, 2,
    2, 1, 3
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorIMatrix), gl.STATIC_DRAW);
  floorIBuffer.itemSize = 1;
  floorIBuffer.numberOfItems = 6;

  textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  var textureCoordinates=[
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,

      0.0, 0.0, // texture Buffer
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  textureBuffer.itemSize = 2;
  textureBuffer.numberOfItems = 24;

  faceTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, faceTextureBuffer);
  var faceTextureCoordinates=[
      // top
      0.0,  0.5,
      0.5,  0.5,
      0.5,  1.0,
      0.0,  1.0,
      // bottom
      0.0,  0.0,
      0.5,  0.0,
      0.5,  0.5,
      0.0,  0.5,
      // left
      0.0,  0.0,
      0.5,  0.0,
      0.5,  0.5,
      0.0,  0.5,
      // right
      0.0,  0.0,
      0.5,  0.0, // texture Buffer
      0.5,  0.5,
      0.0,  0.5,
      // front
      0.5,  0.0,
      1.0,  0.0,
      1.0,  0.5,
      0.5,  0.5,
      // back
      0.0,  0.0,
      0.5,  0.0,
      0.5,  0.5,
      0.0,  0.5
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceTextureCoordinates), gl.STATIC_DRAW);
  faceTextureBuffer.itemSize = 2;
  faceTextureBuffer.numberOfItems = 24;

  bodyTextureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bodyTextureBuffer);
  var bodyTextureCoordinates=[
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bodyTextureCoordinates), gl.STATIC_DRAW);
  bodyTextureBuffer.itemSize = 2;
  bodyTextureBuffer.numberOfItems = 24;
  //load textures
  bodyTexture = gl.createTexture();
  loadImageForTexture('./image/body.jpg', bodyTexture);
  faceTexture = gl.createTexture();
  loadImageForTexture('./image/face.jpg', faceTexture);
  skyboxTexture = gl.createTexture();
  loadImageForTexture('./image/sky.jpg', skyboxTexture);
  floorTexture = gl.createTexture();
  loadImageForTexture('./image/floor.jpg', floorTexture);
}

function redraw() {
  if (requestId && !mouseDown) {
    totalAngle = totalAngle + (1 * Math.PI) / 180.0;// moi 1s quay them 1 do
    if (totalAngle >= 2 * Math.PI) // nếu góc > 360 thì đổi thành góc nhỏ hơn 
      totalAngle = totalAngle - 2 * Math.PI;
    else if (totalAngle < 0) // nếu góc < 0 thì đổi thành góc lon hơn 
      totalAngle = totalAngle + 2 * Math.PI; 
    cameraDistance += 0.05;// moi 1s room gan vao 0.05
  }
  if (deltaFresh == true && mouseDown) {
    totalAngle = totalAngle + deltaMouseX / 10;
    cameraDistance = cameraDistance + deltaMouseY / 10;
    deltaFresh = false;
  }
  var c = Math.cos(totalAngle);
  var s = Math.sin(totalAngle);
  var perspectiveMatrix = new Matrix4();
  perspectiveMatrix.setPerspective(90, 1, 0.01, 10000);
  perspectiveMatrix.lookAt(cameraDistance * c , cameraDistance * s , 
                        cameraDistance, 0, 0, 0, 0, 0, 1);
  gl.uniformMatrix4fv(perspectiveViewUniformPointer, false, perspectiveMatrix.elements);

  // translation of body parts
  var bodyTranslationVertices = [
    -5.5, -4.5,    1,   // back right paw
    5.5,  4.5,    1,   // front left paw
    -5.5,  4.5,    1,   // back left paw
    5.5, -4.5,    1,   // front right paw
    -1.0,    0,    7,   // body
    4.0,    0,   11,   // neck
    -6.5,  -4.5,   5,   // back right leg
    4.5,   4.5,   5,   // front left leg
    -6.5,   4.5,   5,   // back left leg
    4.5,  -4.5,   5,   // front right leg
    -9,     0, 9.5,   // tail
    3.0,  -4.0,  14,   // right ear
    3.0,   4.0,  14   // left ear
  ]; 
  // head - translation
  var faceTranslationVertices = [
    6.0, 0, 14.5
  ];
  // body - scaling
  var bodyScalingVertices = [
    5/2, 3/2, 2/2, // back right paw
    5/2, 3/2, 2/2, // front left paw
    5/2, 3/2, 2/2, // back left paw
    5/2, 3/2, 2/2, // front right paw
    14/2, 6/2, 5/2, // body
    4/2, 4/2, 3/2, // neck
    3/2, 3/2, 6/2,  // back right leg
    3/2, 3/2, 6/2,  // front left leg
    3/2, 3/2, 6/2,  // back left leg
    3/2, 3/2, 6/2,  // front right leg
    2/2, 2/2, 5/2,  // tail
    2/2, 2/2, 5/2,  // right ear
    2/2, 2/2, 5/2   // left ear
  ];
  // head - scaling
  var faceScalingVertices = [
    8/2, 6/2, 4/2
  ];

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // BODY
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexPositionAttributePointer, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bodyTexture);
  gl.uniform1i(samplerUniformPointer, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bodyTextureBuffer);
  gl.vertexAttribPointer(textureCoordinatesAttributePointer, bodyTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

  var body_part = new Matrix4();

  for (var p = 0; p <= 13 * 3; p += 3) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    body_part.setTranslate(bodyTranslationVertices[p], bodyTranslationVertices[p + 1], bodyTranslationVertices[p + 2]);
    body_part.scale(bodyScalingVertices[p], bodyScalingVertices[p + 1], bodyScalingVertices[p + 2]);
    gl.uniformMatrix4fv(transformUniformPointer, false, body_part.elements);
    gl.drawElements(gl.TRIANGLES, indexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0);
  }

  // HEAD
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, faceTexture);
  gl.uniform1i(samplerUniformPointer, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, faceTextureBuffer);
  gl.vertexAttribPointer(textureCoordinatesAttributePointer,faceTextureBuffer.itemSize,gl.FLOAT,false,0,0);

  body_part.setTranslate(faceTranslationVertices[0],faceTranslationVertices[1],faceTranslationVertices[2]);
  body_part.scale(faceScalingVertices[0],faceScalingVertices[1],faceScalingVertices[2]);
  gl.uniformMatrix4fv(transformUniformPointer, false, body_part.elements);
  gl.drawElements(gl.TRIANGLES,indexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);

  // SKY
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
  gl.uniform1i(samplerUniformPointer, 2);
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.vertexAttribPointer(textureCoordinatesAttributePointer,textureBuffer.itemSize,gl.FLOAT,false,0,0);

  var sky_temp = new Matrix4();
  sky_temp.setScale(5000 / 2, 5000 / 2, 5000 / 2);
  gl.uniformMatrix4fv(transformUniformPointer, false, sky_temp.elements);
  gl.drawElements(gl.TRIANGLES,indexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);

  // FLOOR
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVBuffer);
  gl.vertexAttribPointer(vertexPositionAttributePointer,floorVBuffer.itemSize,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorIBuffer);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  gl.uniform1i(samplerUniformPointer, 3);
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.vertexAttribPointer(textureCoordinatesAttributePointer,textureBuffer.itemSize,gl.FLOAT,false,0,0);

  var floor_trans = new Matrix4();
  floor_trans.setTranslate(0, 0, 0);
  floor_trans.scale(12.5, 12.5, 0);
  gl.uniformMatrix4fv(transformUniformPointer, false, floor_trans.elements);
  gl.drawElements(gl.TRIANGLES,floorIBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}

function anim() {
  redraw();
  currentTime = Date.now();
  if (currentTime - previousTime >= 1000) {// ve lai sau 1 giay
    previousTime = currentTime;
  }
  requestId = requestAnimationFrame(anim);
}

function stopAnim() {
  cancelAnimationFrame(requestId);
  requestId = 0;
}

function startAnim() {
  if (!requestId) anim();
}

function handleMouseDown(event) {
  mouseDown = true;
  lastMouseX = event.clientX - rect.left;
  lastMouseY = rect.bottom - event.clientY;
  deltaMouseX = 0;
  deltaMouseY = 0;
  deltaFresh = true;
}

function handleMouseUp(event) {
  mouseDown = false;
}

function handleMouseMove(event) {
  currMouseX = event.clientX - rect.left;
  currMouseY = rect.bottom - event.clientY;
  document.getElementById('mouseX').innerHTML = currMouseX;
  document.getElementById('mouseY').innerHTML = currMouseY;

  if (mouseDown) {
    deltaMouseX = currMouseX - lastMouseX;
    deltaMouseY = currMouseY - lastMouseY;
    deltaFresh = true;
  }
  if (!requestId) redraw();

  lastMouseX = currMouseX;
  lastMouseY = currMouseY;
}

function main() {
  canvas = document.getElementById('canvas');
  canvas.width = 850;
  canvas.height = 740;

  gl = getWebGLContext(canvas);
  initShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  initBuffers();
  gl.enable(gl.DEPTH_TEST);

  previousTime = Date.now();
  canvas.onmousedown = handleMouseDown;
  window.onmouseup = handleMouseUp;
  canvas.onmousemove = handleMouseMove;
  rect = canvas.getBoundingClientRect();
  startAnim();
}
