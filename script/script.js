var c, gl, run, textures, pages;
var cWidth, cHeight, cAspect;

function render(){
	gl = c.getContext('webgl');
	var vs = '';
	var fs = '';
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
	
	var attVBO = [];
	attVBO[0] = create_vbo(vPosition);
	attVBO[1] = create_vbo(vNormal);
	attVBO[2] = create_vbo(vColor);
	var ibo = create_ibo(index);
	
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
	
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	
	var count = 0;
	var lightPosition = [1.0, 1.0, 1.0];
	var ambientColor = [0.1, 0.1, 0.1];
	var eyePosition = [0.0, 0.0, 10.0];
	var centerPoint = [0.0, 0.0, 0.0];
	
	
	m.lookAt(eyePosition, centerPoint, [0.0, 1.0, 0.0], vMatrix);
	m.perspective(45, c.width / c.height, 0.1, 20.0, pMatrix);
	m.multiply(pMatrix, vMatrix, vpMatrix);
	
//	create_texture('lenna.jpg', 0);
	run = true;
	
	(function(){
		count++;
		gl.enable(gl.DEPTH_TEST);
		
		var rad = (count % 360) * Math.PI / 180;
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		gl.viewport(0, 0, c.width, c.height);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, WE.textures[0]);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, WE.textures[1]);
		
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0.0, 1.0, 0.0], mMatrix);
		m.translate(mMatrix, [0.0, 0.0, 3.0], mMatrix);
		m.rotate(mMatrix, rad, [0.0, 1.0, 0.0], mMatrix);
		m.multiply(vpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
		gl.uniform3fv(uniLocation[2], lightPosition);
		gl.uniform3fv(uniLocation[3], ambientColor);
		gl.uniform3fv(uniLocation[4], eyePosition);
		gl.uniform3fv(uniLocation[5], centerPoint);
		gl.uniformMatrix4fv(uniLocation[6], false, mMatrix);
		gl.uniform1i(uniLocation[7], 0);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		
		gl.flush();
		if(run){requestAnimationFrame(arguments.callee);}
	}());
}

window.onload = function(){
	var e;
	cWidth = window.innerWidth;
	cHeight = window.innerHeight;
	cAspect = cWidth / cHeight;
	c = document.getElementById('canvas');
	c.width = cWidth;
	c.height = cHeight;
	pages = []; textures = [];
	e = document.getElementById('content');
	for(i = 0, l = e.childNodes.length; i < l; i++){
		if(e.childNodes[i].className && e.childNodes[i].className.match(/pages/)){
			pages.push(e.childNodes[i]);
			e.childNodes[i].style.width = Math.max(cWidth - 100, 100) + 'px';
			e.childNodes[i].style.height = Math.max(cHeight - 300, 100) + 'px';
		}
	}
//	gl = c.getContext('webgl');
};

window.onresize = function(){
	for(i = 0, l = pages.length; i < l; i++){
		pages[i].style.width = Math.max(cWidth - 100, 100) + 'px';
		pages[i].style.height = Math.max(cHeight - 300, 100) + 'px';
	}
};

// - 各種ユーティリティ関数 ---------------------------------------------------
/**
 * シェーダを生成する関数
 * @param {string} source シェーダのソースとなるテキスト
 * @param {number} type シェーダのタイプを表す定数 gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @return {object} 生成に成功した場合はシェーダオブジェクト、失敗した場合は null
 */
function create_shader(source, type){
	// シェーダを格納する変数
	var shader;
	
	// シェーダの生成
	shader = gl.createShader(type);
	
	// 生成されたシェーダにソースを割り当てる
	gl.shaderSource(shader, source);
	
	// シェーダをコンパイルする
	gl.compileShader(shader);
	
	// シェーダが正しくコンパイルされたかチェック
	if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		
		// 成功していたらシェーダを返して終了
		return shader;
	}else{
		
		// 失敗していたらエラーログをアラートする
		alert(gl.getShaderInfoLog(shader));
		
		// null を返して終了
		return null;
	}
}

/**
 * プログラムオブジェクトを生成しシェーダをリンクする関数
 * @param {object} vs 頂点シェーダとして生成したシェーダオブジェクト
 * @param {object} fs フラグメントシェーダとして生成したシェーダオブジェクト
 * @return {object} 生成に成功した場合はプログラムオブジェクト、失敗した場合は null
 */
function create_program(vs, fs){
	// プログラムオブジェクトの生成
	var program = gl.createProgram();
	
	// プログラムオブジェクトにシェーダを割り当てる
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	
	// シェーダをリンク
	gl.linkProgram(program);
	
	// シェーダのリンクが正しく行なわれたかチェック
	if(gl.getProgramParameter(program, gl.LINK_STATUS)){
	
		// 成功していたらプログラムオブジェクトを有効にする
		gl.useProgram(program);
		
		// プログラムオブジェクトを返して終了
		return program;
	}else{
		
		// 失敗していたらエラーログをアラートする
		alert(gl.getProgramInfoLog(program));
		
		// null を返して終了
		return null;
	}
}

/**
 * VBOを生成する関数
 * @param {Array.<number>} data 頂点属性を格納した一次元配列
 * @return {object} 頂点バッファオブジェクト
 */
function create_vbo(data){
	// バッファオブジェクトの生成
	var vbo = gl.createBuffer();
	
	// バッファをバインドする
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	
	// バッファにデータをセット
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	
	// バッファのバインドを無効化
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// 生成した VBO を返して終了
	return vbo;
}

/**
 * IBOを生成する関数
 * @param {Array.<number>} data 頂点インデックスを格納した一次元配列
 * @return {object} インデックスバッファオブジェクト
 */
function create_ibo(data){
	// バッファオブジェクトの生成
	var ibo = gl.createBuffer();
	
	// バッファをバインドする
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
	
	// バッファにデータをセット
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
	
	// バッファのバインドを無効化
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// 生成したIBOを返して終了
	return ibo;
}

/**
 * VBOをバインドし登録する関数
 * @param {object} vbo 頂点バッファオブジェクト
 * @param {Array.<number>} attribute location を格納した配列
 * @param {Array.<number>} アトリビュートのストライドを格納した配列
 */
function set_attribute(vbo, attL, attS){
	// 引数として受け取った配列を処理する
	for(var i in vbo){
		// バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
		
		// attributeLocationを有効にする
		gl.enableVertexAttribArray(attL[i]);
		
		// attributeLocationを通知し登録する
		gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
	}
}

/**
 * テクスチャを生成する関数
 * @param {string} source テクスチャに適用する画像ファイルのパス
 * @param {number} number テクスチャ用配列に格納するためのインデックス
 */
function create_texture(source, number){
	// イメージオブジェクトの生成
	var img = new Image();
	
	// データのオンロードをトリガーにする
	img.onload = function(){
		// テクスチャオブジェクトの生成
		var tex = gl.createTexture();
		
		// テクスチャをバインドする
		gl.bindTexture(gl.TEXTURE_2D, tex);
		
		// テクスチャへイメージを適用
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		
		// ミップマップを生成
		gl.generateMipmap(gl.TEXTURE_2D);
		
		// テクスチャのバインドを無効化
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		// 生成したテクスチャを変数に代入
		textures[number] = tex;
	};
	
	// イメージオブジェクトのソースを指定
	img.src = source;
}


