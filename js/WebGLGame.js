/**
 * WebGL Game Module
 */
 var WebGLGame = (function () {

	var module = {};

	var objectsGL;

	var peer;

	var running;

	var sources_textures = [
		"./img/textures/field_wall.jpg",
		"./img/textures/field_floor.jpg",
		"./img/textures/ball.jpg",
		"./img/textures/paddle1.jpg",
		"./img/textures/paddle2.jpg"
	];

	function loadTextures(sources, callback){
		var images = [];
		var loadedImages = 0;
		var numImages = 0;
		for(var src in sources) {
			numImages++;
		}
		for(var src in sources) {
			images[src] = new Image();
			images[src].onload = function() {
				if(++loadedImages >= numImages) {
					callback(images);
				}
			}
			images[src].src = sources[src];
		}
	};

	function drawScene() {
		// Clear the canvas before we start drawing on it.
		WebGLUtils.clear();

		// field
		objectsGL.field.draw();

		// ball
		objectsGL.ball.draw();

		// paddle 1
		objectsGL.paddle1.draw();

		// paddle 2
		objectsGL.paddle2.draw();
	};

	function animateScene(){
		if (peer.isInitiator) {
			objectsGL.ball.move();
			objectsGL.paddle1.move();
			objectsGL.paddle1.logic();
			objectsGL.paddle2.logic();
		}	else {
			objectsGL.paddle2.move();
		};
	};

	function send() {
		var data;

		if (peer.isInitiator) {
			data = {
				paddle: {
					x: objectsGL.paddle1.posX
				},
				ball: {
					x: objectsGL.ball.posX,
					y: objectsGL.ball.posY
				}
			};
		} else {
			data = {
				paddle: {
					x: objectsGL.paddle2.posX
				}
			};
		};

		peer.sendData(data);
	};

	function updateScore(ply) {
		$('#' + ply + 'Score').html(parseInt($('#' + ply + 'Score').text()) + 1);
	};

	module.play = function() {
		(function animLoop() {
			animateScene();
			send();
			drawScene();
			running = setTimeout(function() {
				animLoop();
			}, 35);
		})();
	};

	module.onReceiveData = function(data) {
		if (peer.isInitiator){
			objectsGL.paddle2.posX = data.paddle.x;
		} else {
			objectsGL.paddle1.posX = data.paddle.x;
			objectsGL.ball.posX = data.ball.x;
			objectsGL.ball.posY = data.ball.y;
		};
	};

	module.Scored = function(ply){
		if (peer.isInitiator){
			if (ply == '1') {
				updateScore('local');
			} else {
				updateScore('remote');
			}
		} else {
			if (ply == '1') {
				updateScore('remote');
			} else {
				updateScore('local');
			}
		}
	};

	module.resetScore = function(){
		$('#localScore').html('0');
		$('#remoteScore').html('0');
	};

	module.start = function(p, callback) {

		peer = p;

		function initBrowser(images) {
			// Initialize the GL context
			var gl = WebGLUtils.initWebGL(canvas);

			// Only continue if WebGL is available and working
			if (gl) {
				WebGLUtils.initShaders();
				WebGLBuffers.init();
				WebGLUtils.initViewport();
				if (peer.isInitiator){
					WebGLUtils.initMatrix(-0.38*Math.PI, 0);
				} else {
					WebGLUtils.initMatrix(-0.38*Math.PI, Math.PI);
				}
				WebGLUtils.setupTextures(images);
				objectsGL = WebGLObjects.start(p);

				if (callback){
					callback(({type: 'play'}));
				}
			}
		};

		loadTextures(sources_textures, initBrowser);
	};

	module.stop = function() {
		clearTimeout(running);
	};

	return module;

}());