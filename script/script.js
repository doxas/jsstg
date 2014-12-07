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
	attLocation[2] = gl.getAttribLocation(prg, 'color');
	var attStride = [];
	attStride[0] = 3;
	attStride[1] = 3;
	attStride[2] = 4;
	
	var torusData = torus(64, 64, 0.25, 0.75);
	var vPosition = torusData.p;
	var vNormal   = torusData.n;
	var vColor    = torusData.c;
	var index     = torusData.i;
	
	var attTorusVBO = [];
	attTorusVBO[0] = create_vbo(vPosition);
	attTorusVBO[1] = create_vbo(vNormal);
	attTorusVBO[2] = create_vbo(vColor);
	var torusIbo = create_ibo(index);
	
	var sphereData = sphere(24, 24, 1.0, [1.0, 1.0, 1.0, 1.0]);
	vPosition = sphereData.p;
	vNormal   = sphereData.n;
	vColor    = sphereData.c;
	index     = sphereData.i;
	
	var attSphereVBO = [];
	attSphereVBO[0] = create_vbo(vPosition);
	attSphereVBO[1] = create_vbo(vNormal);
	attSphereVBO[2] = create_vbo(vColor);
	var sphereIbo = create_ibo(index);
	
	var uniLocation = [];
	uniLocation[0] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'lightDirection');
	uniLocation[4] = gl.getUniformLocation(prg, 'eyeDirection');
	
	var m = new matIV();
	var mMatrix = m.identity(m.create());
	var vMatrix = m.identity(m.create());
	var pMatrix = m.identity(m.create());
	var vpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	var invMatrix = m.identity(m.create());
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.clearColor(0.0, 0.7, 0.7, 1.0);
	gl.clearDepth(1.0);
	
	var count = 0;
	var lightPosition = [1.0, 5.0, 1.0];
	var eyePosition = [0.0, 0.0, 5.0];
	var centerPoint = [0.0, 0.0, 0.0];
	var upDirection = [0.0, 1.0, 0.0];
	
	run = true;
	
	var viper = {
		position: new Vector(),
		mMatrix: m.identity(m.create()),
		mvpMatrix: m.identity(m.create()),
		init: function(){
			this.vboList = [
				create_vbo(models[0].position),
				create_vbo(models[0].normal),
				create_vbo(models[0].texCoord)
			];
			this.ibo = create_ibo(models[0].index);
			this.indexLength = models[0].vertex;
		},
		move: function(){
			this.position.x -= 1.0;
			if(this.position.x < 0.0){this.position = 10.0;} 
			return;
		},
		draw: function(){
			set_attribute(this.vboList, attLocation, attStride, this.ibo);
			m.identity(mMatrix);
			m.translate(mMatrix, [this.position.x, this.position.y, this.position.z], mMatrix);
			gl.drawElements(gl.TRIANGLES, this.indexLength, gl.UNSIGNED_SHORT, 0);
			return;
		}
	};
	
	var fire = {
		move: function(){
			return;
		}
	};
	
	var cloud = {
		move: function(){
			return;
		}
	};
	
	animation();
	
	function animation(){
		count++;
		
		var rad = (count % 360) * Math.PI / 180;
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.viewport(0, 0, cWidth, cHeight);
		gl.uniform3fv(uniLocation[3], lightPosition);
		gl.uniform3fv(uniLocation[4], eyePosition);
		
		m.lookAt(eyePosition, centerPoint, upDirection, vMatrix);
		m.perspective(45, cAspect, 0.1, 50.0, pMatrix);
		m.multiply(pMatrix, vMatrix, vpMatrix);
		
		// torus
		set_attribute(attTorusVBO, attLocation, attStride, torusIbo);
		
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [1.0, 1.0, 0.0], mMatrix);
		m.rotate(mMatrix, Math.PI / 2, [1.0, 0.0, 0.0], mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		
		gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);
		
		
		
		
		// sphere
		set_attribute(attSphereVBO, attLocation, attStride, sphereIbo);
		
		m.identity(mMatrix);
		m.translate(mMatrix, [10.0 - ((count / 10) % 20), 0.0, -25.0], mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		
		gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);
		
		
		
		
		
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
			gl.bindTexture(gl.TEXTURE_2D, null);
			textures[number] = tex;
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
	pages = []; models = []; textures = [];
	e = document.getElementById('content');
	for(i = 0, l = e.childNodes.length; i < l; i++){
		if(e.childNodes[i].className && e.childNodes[i].className.match(/pages/)){
			pages.push(e.childNodes[i]);
			e.childNodes[i].style.width = Math.max(cWidth - 100, 100) + 'px';
			e.childNodes[i].style.height = Math.max(cHeight - 300, 100) + 'px';
		}
	}
//	pages[0].className = 'pages view';
	
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
		if(models.length === 3){
			if(textures.length === 0){
				pages[0].className = 'pages hide';
				pages[1].className = 'pages view';
				render();
			}
		}
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

