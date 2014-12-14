var c, gl, ax, run, models, textures, pages;
var cWidth, cHeight, cAspect;

function render(){
	gl = c.getContext('webgl');

	var vs = document.getElementById('vs').textContent;
	var fs = document.getElementById('fs').textContent;
	var vShader = create_shader(vs, gl.VERTEX_SHADER);
	var fShader = create_shader(fs, gl.FRAGMENT_SHADER);
	var prg = create_program(vShader, fShader);
	var attLocation = [];
	attLocation[0] = gl.getAttribLocation(prg, 'position');
	attLocation[1] = gl.getAttribLocation(prg, 'normal');
	attLocation[2] = gl.getAttribLocation(prg, 'texCoord');
	var attStride = [];
	attStride[0] = 3;
	attStride[1] = 3;
	attStride[2] = 2;
	var uniLocation = [];
	uniLocation[0] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'lightDirection');
	uniLocation[4] = gl.getUniformLocation(prg, 'eyeDirection');
	uniLocation[5] = gl.getUniformLocation(prg, 'texture');
	uniLocation[6] = gl.getUniformLocation(prg, 'edges');
	
	vs = document.getElementById('fvs').textContent;
	fs = document.getElementById('ffs').textContent;
	vShader = create_shader(vs, gl.VERTEX_SHADER);
	fShader = create_shader(fs, gl.FRAGMENT_SHADER);
	var fPrg = create_program(vShader, fShader);
	var fAttLocation = [];
	fAttLocation[0] = gl.getAttribLocation(fPrg, 'position');
	fAttLocation[1] = gl.getAttribLocation(fPrg, 'texCoord');
	var fAttStride = [];
	fAttStride[0] = 3;
	fAttStride[1] = 2;
	var fUniLocation = [];
	fUniLocation[0] = gl.getUniformLocation(fPrg, 'mMatrix');
	fUniLocation[1] = gl.getUniformLocation(fPrg, 'mvpMatrix');
	fUniLocation[2] = gl.getUniformLocation(fPrg, 'texture');
	
	var m = new matIV();
	var vMatrix = m.identity(m.create());
	var pMatrix = m.identity(m.create());
	var vpMatrix = m.identity(m.create());
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clearColor(0.0, 0.7, 0.7, 1.0);
	gl.clearDepth(1.0);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	
	var count = 0;
	var lightPosition = [5.0, 10.0, 5.0];
	var eyePosition = [0.0, 5.0, 25.0];
	var centerPoint = [0.0, 0.0, 0.0];
	var upDirection = [0.0, 1.0, 0.0];
	
	run = true;
	
	var viper = {
		position: new Vector(),
		diff: new Vector(),
		count: 0,
		mode: 'normal',
		moving: false,
		param: 0,
		paramf: 0.0,
		mMatrix: m.identity(m.create()),
		sMatrix: m.identity(m.create()),
		mvpMatrix: m.identity(m.create()),
		invMatrix: m.identity(m.create()),
		init: function(){
			this.position.x = 0.0;
			this.position.y = 0.0;
			this.position.z = 0.0;
			this.vboList = [
				create_vbo(models[0].position),
				create_vbo(models[0].normal),
				create_vbo(models[0].texCoord)
			];
			this.ibo = create_ibo(models[0].index);
			this.indexLength = models[0].vertex;
		},
		move: function(){
			var rad, rad2;
			switch(this.mode){
				case 'normal':
					this.count++;
					rad = this.count % 360 * Math.PI / 180;
					rad2 = this.count % 180 * Math.PI / 90;
					this.diff.x = this.position.x;
					this.position.x = Math.cos(rad) * 3;
					this.position.y = Math.sin(rad2) * 1.5;
					this.diff.y = this.position.x;
					this.diff.z = Math.PI * 2 - (this.diff.y - this.diff.x) * 10;
					break;
				case 'dash':
					// param = 0 start, param = 75 end;
					this.count++;
					this.param++;
					rad = this.count % 360 * Math.PI / 180;
					rad2 = this.count % 180 * Math.PI / 90;
					this.diff.x = this.position.x;
					this.position.x = Math.cos(rad) * 3;
					this.position.y = Math.sin(rad2) * 1.5;
					this.diff.y = this.position.x;
					this.diff.z = Math.PI * 2 - (this.diff.y - this.diff.x) * 10;
					var e = backincubic(this.param, 0, 1, 75);
					this.position.z -= e;
					if(this.position.z < -75){
						this.position.z = 75;
						this.param = 0;
						this.mode = 'over';
					}
					break;
				case 'over':
					// param = 0 start, param = 75 end;
					this.count++;
					this.param++;
					rad = this.count % 360 * Math.PI / 180;
					rad2 = this.count % 180 * Math.PI / 90;
					this.diff.x = this.position.x;
					this.position.x = Math.cos(rad) * 3;
					this.position.y = Math.sin(rad2) * 1.5;
					this.diff.y = this.position.x;
					this.diff.z = Math.PI * 2 - (this.diff.y - this.diff.x) * 10;
					var e = outquintic(this.param, 0, 1, 75);
					this.position.z -= e;
					if(this.position.z <= 0){
						this.param = 0;
						this.moving = false;
						this.mode = 'normal';
					}
					break;
				case 'turn':
					// param = 0 start, param = 50 end;
					this.param++;
					rad = this.count % 360 * Math.PI / 180;
					rad2 = this.count % 180 * Math.PI / 90;
					var e = backincubic(this.param, 0, 1, 50) / 2;
					this.diff.z = Math.PI * 2 - (this.diff.y - this.diff.x) * 10 + e;
					this.position.x -= e;
					this.position.z -= e;
					if(this.position.x < -50 + this.paramf){
						this.position.z = 75;
						this.param = 0;
						this.mode = 'over';
					}
					break;
				case 'return':
					// param = 0 start, param = 50 end;
					this.param++;
					rad = this.count % 360 * Math.PI / 180;
					rad2 = this.count % 180 * Math.PI / 90;
					var e = backincubic(this.param, 0, 1, 50) / 2;
					this.diff.z = Math.PI * 2 - (this.diff.y - this.diff.x) * 10 - e;
					this.position.x += e;
					this.position.z -= e;
					if(this.position.x > 50 + this.paramf){
						this.position.z = 75;
						this.param = 0;
						this.mode = 'over';
					}
					break;
			}
			return;
		},
		action: function(eve){
			if(!eve){return;}
			var e = parseInt(eve.currentTarget.id.replace(/button/, ''));
			switch(e){
				case 1:
					if(!viper.moving){
						viper.moving = true;
						viper.param = 0;
						viper.mode = 'dash';
					}
					break;
				case 2:
					if(!viper.moving){
						viper.paramf = viper.position.x;
						viper.moving = true;
						viper.param = 0;
						viper.mode = 'turn';
					}
					break;
				case 3:
					if(!viper.moving){
						viper.paramf = viper.position.x;
						viper.moving = true;
						viper.param = 0;
						viper.mode = 'return';
					}
					break;
			}
		},
		draw: function(scales){
			set_attribute(this.vboList, attLocation, attStride, this.ibo);
			m.identity(this.mMatrix);
			m.translate(this.mMatrix, [this.position.x, this.position.y, this.position.z], this.mMatrix);
			m.rotate(this.mMatrix, this.diff.z, [0.0, 0.0, 1.0], this.mMatrix);
			m.rotate(this.mMatrix, Math.PI, [0.0, 1.0, 0.0], this.mMatrix);
			if(scales){
				m.scale(this.mMatrix, [1.05, 1.05, 1.05], this.sMatrix);
				m.multiply(vpMatrix, this.sMatrix, this.mvpMatrix);
				m.inverse(this.mMatrix, this.invMatrix);
			}else{
				m.multiply(vpMatrix, this.mMatrix, this.mvpMatrix);
				m.inverse(this.mMatrix, this.invMatrix);
			}
			gl.uniformMatrix4fv(uniLocation[0], false, this.mMatrix);
			gl.uniformMatrix4fv(uniLocation[1], false, this.mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[2], false, this.invMatrix);
			gl.drawElements(gl.TRIANGLES, this.indexLength, gl.UNSIGNED_SHORT, 0);
			return;
		}
	};
	buttons[1].addEventListener('click', viper.action, true);
	buttons[2].addEventListener('click', viper.action, true);
	buttons[3].addEventListener('click', viper.action, true);
	
	function fire(){
		this.position = new Vector();
		this.count = 0;
		this.mMatrix = m.identity(m.create());
		this.mvpMatrix = m.identity(m.create());
		this.vboList = null;
		this.ibo = null;
		this.indexLength = 0;
		this.init = function(v){
			this.position.x = v.x;
			this.position.y = v.y;
			this.position.z = v.z;
			this.vboList = [
				create_vbo(models[1].position),
				create_vbo(models[1].texCoord)
			];
			this.ibo = create_ibo(models[1].index);
			this.indexLength = models[1].vertex;
		};
		this.draw = function(left, v){
			var rad;
			this.count += viper.mode === 'normal' ? 5 : 15;
			if(left){
				rad = this.count % 360 * Math.PI / 180;
			}else{
				rad = (359 - this.count % 360) * Math.PI / 180;
			}
			set_attribute(this.vboList, fAttLocation, fAttStride, this.ibo);
			m.identity(this.mMatrix);
			m.multiply(this.mMatrix, v.mMatrix, this.mMatrix);
			m.translate(this.mMatrix, [this.position.x, this.position.y, this.position.z], this.mMatrix);
			m.rotate(this.mMatrix, rad, [0.0, 0.0, 1.0], this.mMatrix);
			m.multiply(vpMatrix, this.mMatrix, this.mvpMatrix);
			gl.uniformMatrix4fv(fUniLocation[0], false, this.mMatrix);
			gl.uniformMatrix4fv(fUniLocation[1], false, this.mvpMatrix);
			gl.uniform1i(fUniLocation[2], 0);
			gl.drawElements(gl.TRIANGLES, this.indexLength, gl.UNSIGNED_SHORT, 0);
			return;
		}
	};
	
	function cloud(){
		this.position = new Vector();
		this.mMatrix = m.identity(m.create());
		this.sMatrix = m.identity(m.create());
		this.mvpMatrix = m.identity(m.create());
		this.invMatrix = m.identity(m.create());
		this.vboList = null;
		this.ibo = null;
		this.indexLength = 0;
		this.speed = 0;
		this.init = function(v){
			this.position.x = v.x;
			this.position.y = v.y;
			this.position.z = v.z;
			this.speed = v.w;
			this.vboList = [
				create_vbo(models[2].position),
				create_vbo(models[2].normal),
				create_vbo(models[2].texCoord)
			];
			this.ibo = create_ibo(models[2].index);
			this.indexLength = models[2].vertex;
		};
		this.move = function(){
			this.position.z += this.speed;
			if(this.position.z > 75.0){this.position.z = -75.0;} 
			return;
		};
		this.draw = function(scales){
			set_attribute(this.vboList, attLocation, attStride, this.ibo);
			m.identity(this.mMatrix);
			m.translate(this.mMatrix, [this.position.x, this.position.y, this.position.z], this.mMatrix);
			if(scales){
				m.scale(this.mMatrix, [1.05, 1.05, 1.05], this.sMatrix);
				m.multiply(vpMatrix, this.sMatrix, this.mvpMatrix);
				m.inverse(this.mMatrix, this.invMatrix);
			}else{
				m.multiply(vpMatrix, this.mMatrix, this.mvpMatrix);
				m.inverse(this.mMatrix, this.invMatrix);
			}
			gl.uniformMatrix4fv(uniLocation[0], false, this.mMatrix);
			gl.uniformMatrix4fv(uniLocation[1], false, this.mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[2], false, this.invMatrix);
			gl.drawElements(gl.TRIANGLES, this.indexLength, gl.UNSIGNED_SHORT, 0);
			return;
		}
	};
	
	viper.init();
	
	var lFire = new fire();
	var rFire = new fire();
	lFire.init({x:  1.65, y: 0.1, z: -2.45});
	rFire.init({x: -1.65, y: 0.1, z: -2.45});
	
	var clouds = [];
	var cloudCount = 15;
	for(var i = 0; i < cloudCount; i++){
		clouds[i] = new cloud();
		clouds[i].init({
			x: Math.random() * 80 - 40,
			y: -25 + Math.random() * 10,
			z: 10 - Math.random() * 60,
			w: Math.random() * 0.5 + 0.25
		});
	}
	
	create_texture('image/test.jpg', 0);
	
	function animation(){
		count++;
		var rad = (count % 360) * Math.PI / 180;
		
		gl.useProgram(prg);
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.viewport(0, 0, cWidth, cHeight);
		gl.uniform3fv(uniLocation[3], lightPosition);
		gl.uniform3fv(uniLocation[4], eyePosition);
		gl.uniform1i(uniLocation[5], 0);
		
		m.lookAt(eyePosition, centerPoint, upDirection, vMatrix);
		m.perspective(45, cAspect, 1.0, 75.0, pMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);
		
		// cloud edge
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.disable(gl.BLEND);
		gl.uniform1i(uniLocation[6], true);
		
		for(var i = 0; i < cloudCount; i++){
			clouds[i].move();
			clouds[i].draw(true);
		}
		
		// cloud body
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
		gl.cullFace(gl.BACK);
		gl.uniform1i(uniLocation[6], false);
		for(var i = 0; i < cloudCount; i++){
			clouds[i].draw();
		}
		
		// viper edge
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);
		gl.cullFace(gl.FRONT);
		gl.disable(gl.BLEND);
		gl.uniform1i(uniLocation[6], true);
		
		viper.move();
		viper.draw(true);
		
		// viper body
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
		gl.cullFace(gl.BACK);
		gl.uniform1i(uniLocation[6], false);
		viper.draw();
		
		// fire draw
		gl.disable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		
		gl.useProgram(fPrg);
		
		lFire.draw(true, viper);
		rFire.draw(false, viper);
		
		gl.flush();
		if(run){requestAnimationFrame(animation);}
	}
	
	function create_shader(source, type){
		var shader;
		shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			return shader;
		}else{
			alert(gl.getShaderInfoLog(shader));
			return null;
		}
	}
	
	function create_program(vs, fs){
		var program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if(gl.getProgramParameter(program, gl.LINK_STATUS)){
			gl.useProgram(program);
			return program;
		}else{
			alert(gl.getProgramInfoLog(program));
		}
	}
	
	function create_vbo(data){
		var vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		return vbo;
	}
	
	function set_attribute(vbo, attL, attS, ibo){
		for(var i in vbo){
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			gl.enableVertexAttribArray(attL[i]);
			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
		}
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	}
	
	function create_ibo(data){
		var ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		return ibo;
	}
	
	function create_texture(source, number){
		var img = new Image();
		img.onload = function(){
			var tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			gl.generateMipmap(gl.TEXTURE_2D);
			textures[number] = tex;
			
			// animation call
			gl.bindTexture(gl.TEXTURE_2D, textures[0]);
			animation();
			
		};
		img.src = source;
	}
}

window.onload = function(){
	var e, axTarget;
	cWidth = window.innerWidth;
	cHeight = window.innerHeight;
	cAspect = cWidth / cHeight;
	c = document.getElementById('canvas');
	c.width = cWidth;
	c.height = cHeight;
	pages = []; buttons = []; models = []; textures = [];
	e = document.getElementById('content');
	for(i = 0, l = e.childNodes.length; i < l; i++){
		if(e.childNodes[i].className && e.childNodes[i].className.match(/pages/)){
			pages.push(e.childNodes[i]);
			e.childNodes[i].style.width = Math.max(cWidth - 100, 100) + 'px';
			e.childNodes[i].style.height = Math.max(cHeight - 300, 100) + 'px';
		}
	}
	for(i = 1; i < pages.length; i++){
		buttons[i] = document.getElementById('button' + i);
		buttons[i].addEventListener('click', function(eve){
			var k = parseInt(eve.currentTarget.id.replace(/button/, ''));
			for(j = 0; j < pages.length; j++){
				var s = k === j ? 'view' : 'hide';
				pages[j].className = 'pages ' + s;
			}
			switch(i){
				case 1:
					
					break;
			}
		}, true);
	}
	
	window.addEventListener('keydown', function(eve){run = (eve.keyCode !== 27);}, true);
	window.addEventListener('resize', function(){
		cWidth = window.innerWidth;
		cHeight = window.innerHeight;
		cAspect = cWidth / cHeight;
		c.width = cWidth;
		c.height = cHeight;
		for(i = 0, l = pages.length; i < l; i++){
			pages[i].style.width = Math.max(cWidth - 100, 100) + 'px';
			pages[i].style.height = Math.max(cHeight - 300, 100) + 'px';
		}
	});
	
	ax = new Ajax(function(){
		switch(axTarget){
			case 'viper.obj':
				models[0] = JSON.parse(objsonConvert(ax.getResponse()));
				axTarget = 'fire.obj';
				ax.requestGet('http://jp.wgld.org/jsstg/2015f/model/' + axTarget);
				break;
			case 'fire.obj':
				models[1] = JSON.parse(objsonConvert(ax.getResponse()));
				axTarget = 'cloud.obj';
				ax.requestGet('http://jp.wgld.org/jsstg/2015f/model/' + axTarget);
				break;
			case 'cloud.obj':
				models[2] = JSON.parse(objsonConvert(ax.getResponse()));
				loadResource();
				break;
		}
	});
	ax.initialize();
	axTarget = 'viper.obj';
	ax.requestGet('http://jp.wgld.org/jsstg/2015f/model/' + axTarget);
	
	function loadResource(){
		pages[0].className = 'pages hide';
		pages[1].className = 'pages view';
		render();
	}
};

function Ajax(callBackFunction){
	var response = '';
	this.h;
	this.initialize = function(){
		if(window.XMLHttpRequest){this.h = new XMLHttpRequest();}
		if(this.h){
			response = '';
			return true;
		}else{
			return false;
		}
	};
	if(callBackFunction != null){
		this.callBack = function(){
			if(this.readyState === 4){
				response = this.responseText;
				callBackFunction();
			}
		};
	}else{
		this.callBack = null;
	}
	this.requestGet = function(url){
		if(!this.h){return false;}
		this.h.abort();
		this.h.open('get', url, true);
		this.h.onreadystatechange = this.callBack;
		this.h.send(null);
	};
	this.getResponse = function(){
		return response;
	};
}

function Vector(){
	this.x = 0; this.y = 0; this.z = 0;
}

function backincubic(t, s, e, d){
	var ts = (t /= d) * t;
	return s + e * (2 * ts * ts + -ts);
}

function outquintic(t, s, e, d){
	var ts= (t /= d) * t;
	var tc= ts * t;
	return s + e * (tc * ts + -5 * ts * ts + 10 * tc + -10 * ts + 5 * t);
}

function outbackcubic(t, s, e, d){
	var ts = (t /= d) * t;
	var tc = ts * t;
	return s + e * (4 * tc + -9 * ts + 6 * t);
}