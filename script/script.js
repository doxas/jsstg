var c, gl, run, textures, pages;
var cWidth, cHeight, cAspect;

window.onload = function(){
	var e;
	cWidth = window.innerWidth;
	cHeight = window.innerHeight;
	cAspect = cWidth / cHeight;
	c = document.getElementById('canvas');
	c.width = cWidth;
	c.height = cHeight;
	pages = [];
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
		pagess[i].style.height = Math.max(cHeight - 300, 100) + 'px';
	}
};
