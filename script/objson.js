// ------------------------------------------------------------------------------------------------
// objson.js
// version 0.0.1
// Copyright (c) doxas
// ------------------------------------------------------------------------------------------------

function objsonConvert(source){
	source = source.replace(/^#[\x20-\x7e]+\s$/gm, '');
	source = source.replace(/^g[\x20-\x7e]+\s$/gm, '');
	source = source.replace(/^g\s$/gm, '');
	source = source.replace(/\x20{2,}/gm, '\x20');
	source = source.replace(/^\s/gm, '');
	var rows = source.match(/[\x20-\x7e]+\s/gm);
	var i, j, k, l;
	var a, b, c, d;
	var len, dest, fNormal;
	var pos = 0;
	var nor = 0;
	var tex = 0;
	var position = [];
	var normal   = [];
	var texCoord = [];
	var vertex   = [];
	var index    = [];
	var indices  = [];
	for(i = 0, len = rows.length; i < len; i++){
		switch(rows[i].substr(0, 2)){
			case 'v ':
				a = rows[i].match(/-?[\d\.]+(e(?=-)?|e(?=\+)?)?[-\+\d\.]*/g);
				if(vertex[pos] == null){
					vertex[pos] = new objsonVertexData();
					vertex[pos].faceIndex = [];
				}
				vertex[pos].position = [a[0], a[1], a[2]];
				pos++;
				break;
			case 'vn':
				a = rows[i].match(/-?[\d\.]+(e(?=-)?|e(?=\+)?)?[-\+\d\.]*/g);
				if(vertex[nor] == null){
					vertex[nor] = new objsonVertexData();
					vertex[nor].faceIndex = [];
				}
				vertex[nor].normal = [a[0], a[1], a[2]];
				nor++;
				break;
			case 'vt':
				a = rows[i].match(/-?[\d\.]+(e(?=-)?|e(?=\+)?)?[-\+\d\.]*/g);
				if(vertex[tex] == null){
					vertex[tex] = new objsonVertexData();
					vertex[tex].faceIndex = [];
				}
				vertex[tex].texCoord = [a[0], a[1]];
				tex++;
				break;
			case 'f ':
				a = rows[i].match(/[\d\/]+/g);
				index.push(a[0], a[1], a[2]);
				if(a.length > 3){
					index.push(a[2], a[3], a[0]);
				}
				break;
			default :
				break;
		}
	}
	if(nor === 0){
		j = index.length / 3;
		fNormal = new Array(j);
		for(i = 0; i < j; i++){
			a = index[i * 3    ].split(/\//);
			b = index[i * 3 + 1].split(/\//);
			c = index[i * 3 + 2].split(/\//);
			fNormal[i] = faceNormal(vertex[a[0] - 1].position, vertex[b[0] - 1].position, vertex[c[0] - 1].position);
			vertex[a[0] - 1].faceIndex.push(i);
			vertex[b[0] - 1].faceIndex.push(i);
			vertex[c[0] - 1].faceIndex.push(i);
		}
		for(i = 0; i < pos; i++){
			a = [0.0, 0.0, 0.0];
			b = vertex[i].faceIndex;
			k = b.length;
			for(j = 0; j < k; j++){
				a[0] += parseFloat(fNormal[b[j]][0]);
				a[1] += parseFloat(fNormal[b[j]][1]);
				a[2] += parseFloat(fNormal[b[j]][2]);
			}
			vertex[i].normal = vec3Normalize(a);
		}
	}
	for(i = 0, len = index.length; i < len; i++){
		j = Math.floor(i / 3);
		a = index[i].split(/\//);
		k = a[0] - 1;
		if(indices[k] == null){
			indices[k] = new objsonVertexData();
			indices[k].position = k;
		}
		if(a[2] != null){
			if(a[2] !== ''){
				if(indices[k].normal == null){
					indices[k].normal = a[2] - 1;
				}else{
					if(indices[k].normal !== a[2] - 1){
						indices[pos] = new objsonVertexData();
						indices[pos].position = k;
						indices[pos].normal = a[2] - 1;
						k = pos;
						pos++;
					}
				}
			}
		}
		if(a[1] != null){
			if(a[1] !== ''){
				if(indices[k].texCoord == null){
					indices[k].texCoord = a[1] - 1;
				}else{
					if(indices[k].texCoord !== a[1] - 1){
						indices[pos] = new objsonVertexData();
						indices[pos].position = a[0] - 1;
						if(a[2] != null){
							if(a[2] !== ''){
								indices[pos].normal = a[2] - 1;
							}
						}
						indices[pos].texCoord = a[1] - 1;
						k = pos;
						pos++;
					}
				}
			}
		}
		index[i] = k;
	}
	for(i = 0, len = indices.length; i < len; i++){
		a = indices[i];
		b = []; c = []; d = [];
		if(a != null){
			k = a.position;
			b = vertex[k].position;
			position[i * 3]     = b[0];
			position[i * 3 + 1] = b[1];
			position[i * 3 + 2] = b[2];
			if(nor > 0){k = a.normal;}
			c = vertex[k].normal;
			normal[i * 3]     = c[0];
			normal[i * 3 + 1] = c[1];
			normal[i * 3 + 2] = c[2];
			if(tex > 0){
				k = a.texCoord;
				d = vertex[k].texCoord;
				texCoord[i * 2]     = d[0];
				texCoord[i * 2 + 1] = d[1];
			}
		}else{
			b = vertex[i].position;
			position[i * 3]     = b[0];
			position[i * 3 + 1] = b[1];
			position[i * 3 + 2] = b[2];
			c = vertex[i].normal;
			normal[i * 3]     = c[0];
			normal[i * 3 + 1] = c[1];
			normal[i * 3 + 2] = c[2];
			if(tex > 0){
				d = vertex[i].texCoord;
				texCoord[i * 2]     = d[0];
				texCoord[i * 2 + 1] = d[1];
			}
		}
	}
	dest = '{';
	dest += '"vertex":' + indices.length;
	dest += ',"face":' + index.length / 3;
	dest += ',"position":[' + position.join(',') + ']';
	dest += ',"normal":[' + normal.join(',') + ']';
	if(tex > 0){dest += ',"texCoord":[' + texCoord.join(',') + ']';}
	dest += ',"index":[' + index.join(',') + ']';
	dest += '}';
	return dest;
}

function objsonVertexData(){
	this.position = null;
	this.normal   = null;
	this.texCoord = null;
	this.faceIndex = null;
}

function vec3Normalize(v, d){
	var e, dig;
	var n = [0.0, 0.0, 0.0];
	var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	if(l > 0){
		if(!d){dig = 5;}else{dig = d;}
		e = 1.0 / l;
		n[0] = (v[0] * e).toFixed(dig);
		n[1] = (v[1] * e).toFixed(dig);
		n[2] = (v[2] * e).toFixed(dig);
	}
	return n;
}

function faceNormal(v0, v1, v2){
	var n = [];
	var vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
	var vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
	n[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
	n[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
	n[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];
	return vec3Normalize(n);
}
