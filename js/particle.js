var Alchemy = (function(){
    var o = {};
    
    //INITIALIZATION
    var prefix = "-webkit-";
    var backdrop = document.createElement("div");
    backdrop.id = "backdrop";
    document.body.appendChild(backdrop);
    var camera = document.createElement("div");
    camera.className = "camera";
    backdrop.appendChild(camera);
    var windowSize = vec2.create();
    function handleResize(){
        vec2.set(windowSize,document.documentElement.clientWidth,document.documentElement.clientHeight);
    }
    window.addEventListener("resize",handleResize);
    handleResize();
	
	var maxSpeed = 10000;
	var elemCharge = 1.602176565e-19;
	var coulomb = 8.9875517873681764e9;
	var scale = 10e21;
    var pScratch = vec2.create();
    var cScratch = vec3.create();
    var pScratch3 = vec2.create();
    var iScratch1 = vec2.create();
    var iScratch2 = vec2.create();
    var iScratch3 = vec2.create();
    var iScratch4 = vec2.create();
    var iScratch5 = vec2.create();
    var iScratch6 = vec2.create();
    var matString = '';
    var fDist = 0;
    var fMag = 0;
    var tTmp = 0;
    o.temperature = 0;
    var i = 0;
    var i2 = 0;
    var pDefaults = {
        mass:1,
        charge:0,
        size:6
    };
    
    //CLASSES=====================================================================================================
    var particles = [];
    o.particles = particles;
    function Particle(p){
        if(!p){ p = pDefaults; }
        this.position = p.position||vec2.fromValues(Math.floor(Math.random()*windowSize[0]),Math.floor(Math.random()*windowSize[1]));
        this.velocity = p.velocity||vec2.fromValues(Math.floor(Math.random()*10),Math.floor(Math.random()*10));
		this.speed = vec2.len(this.velocity)/maxSpeed;
        this.force = vec2.create();
        this.mass = p.mass||pDefaults.mass;
		this.invMass = Math.sqrt(1-((this.speed)*(this.speed)))/this.mass;
        this.charge = p.charge||pDefaults.charge;
        this.matrix = mat4.create();
        this.size = p.size||pDefaults.size;
        
        this.skin = document.createElement("div");
        this.skin.className = "particle";
        
        this.id = particles.length;
        return this;
    }
    Particle.prototype.update = function(t){
        this.boundaryCollision();
        this.calcForces();
        fMag = t*this.invMass;
        
        //RK4 Integration
        //First step is just current position and velocity, acceleration is constant over interval
        
        //Second iteration, halfway along
        vec2.scaleAndAdd(iScratch1,this.position,this.velocity,t/2);
        vec2.scaleAndAdd(iScratch2,this.velocity,this.force,fMag/2);
        
        //Third iteration, 75%
        vec2.scaleAndAdd(iScratch3,this.position,iScratch2,t/2);
        vec2.scaleAndAdd(iScratch4,iScratch2,this.force,fMag/4);
        
        //Fourth, all the way at finish
        vec2.scaleAndAdd(iScratch5,this.position,iScratch4,t);
        vec2.scaleAndAdd(iScratch6,iScratch4,this.force,fMag/8);
        
        //Combine all the positions calulated
        vec2.scaleAndAdd(iScratch2,this.velocity,iScratch2,2);          //Add 1 and 2 (weight 2 double)
        vec2.scaleAndAdd(iScratch2,iScratch2,iScratch4,2);              //Add 3 to before(also double weight)
        vec2.add(iScratch2,iScratch2,iScratch6);                        //Add 4 to before
        vec2.scaleAndAdd(this.position,this.position,iScratch2,t/6);    //Div by 6 to finish wieghting and scale to timestep
        
        //Combine the accelerations
        vec2.scale(iScratch1,this.force,6);                             //Only calculating force once, so just scale up by 6
        vec2.scaleAndAdd(this.velocity,this.velocity,iScratch1,t/6);    //Div by six and scale to timestep
		this.speed = vec2.len(this.velocity)/maxSpeed;
		fMag = 1-(this.speed)*(this.speed);
		if(fMag < 0) console.log(this);
		this.invMass = Math.sqrt(fMag)/this.mass;
        tTmp += this.speed;                                //And now that we have velocity, add to temperature
        
        //Drawing
        mat4.identity(this.matrix);
        this.matrix[12] = this.position[0];
        this.matrix[13] = this.position[1];
        matString = prefix;
        matString += "transform:";
        matString += mat4.str(this.matrix);
		if(this.color){
			matString += "; border-color:";
			matString += this.colorCode;
		}
        this.skin.style.cssText = matString;
        tTmp += vec2.len(this.velocity);
    }
    Particle.prototype.boundaryCollision = function(){
        if (this.position[0] < 0) {
            this.position[0] = 0;
            this.velocity[0] *= -0.9;
        }
        if (this.position[1] < 0) {
            this.position[1] = 0;
            this.velocity[1] *= -0.9;
        }
        if (this.position[0] > windowSize[0]) {
            this.position[0] = windowSize[0];
            this.velocity[0] *= -0.9;
        }
        if (this.position[1] > windowSize[1]) {
            this.position[1] = windowSize[1];
            this.velocity[1] *= -0.9;
        }
    }
    Particle.prototype.calcForces = function(t){
        for (var i2 = this.id + 1;i2 < particles.length;i2++){
            vec2.sub(pScratch,particles[i2].position,this.position);                    //Direction to reach target
            fDist = vec2.length(pScratch);                                              //Distance to target
			vec2.scale(pScratch,pScratch,1/fDist);										//normalize direction
			if(this.color&&particles[i2].color){
				fMag = this.size + particles[i2].size;
				if (this.partner[0] == i2 || this.partner[1] == i2){
					if (fMag < fDist){
						fMag -= fDist;
						fMag += 10;
						vec2.scaleAndAdd(this.position,this.position,pScratch,-fMag);
					}
					continue;
				}
				if (fMag > fDist){
					vec3.add(cScratch,this.color,particles[i2].color);
					if (vec3.len(cScratch) < 2){
						fMag -= fDist;
						fMag += 10;
						vec2.scaleAndAdd(this.position,this.position,pScratch,-fMag);
						vec2.scaleAndAdd(particles[i2].position,particles[i2].position,pScratch,fMag);
						vec2.set(this.velocity,0,0);
						vec2.set(particles[i2].velocity,0,0);
						this.partner[this.partner.length] = i2;
						particles[i2].partner[particles[i2].partner.length] = i;
						if(this.partner.length == 2){
							particles[this.partner[0]].partner[1] = i2;
							particles[i2].partner[1] = this.partner[0];
						}
						this.mass += 309.63;
						particles[i2].mass += 309.63;
						vec3.copy(this.color,cScratch);
						vec3.copy(particles[i2].color,cScratch);
						continue;
					}
				}
			}
            fMag = ((this.charge*-1)*particles[i2].charge) / (fDist*fDist);             //Resume calculating forces
            if (fMag > 1000) fMag = 1000;                                               //don't let it go to infinity
            vec2.scale(pScratch,pScratch,fMag)    										//scale by force magnitude
            vec2.add(this.force,this.force,pScratch);                                   //Set the force vector
			vec2.sub(particles[i2].force,particles[i2].force,pScratch);
        }
    }
    Particle.prototype.resolveCollision = function(target){
        return 0.9;
    }
    
    function Quark(type,p){
        if(!p){ p = pDefaults; }
        if (type == "up"){
            p.mass = 2.3;
            p.charge = 200;
        }else if (type == "down"){
            p.mass = 4.8;
            p.charge = -100;
        }
        Particle.call(this,p);
		
		fMag = Math.floor(Math.random()*3);
		if(fMag == 0){
			this.color = vec3.fromValues(1,0,0);
			this.colorCode = "#f00";
		}else if(fMag == 1){
			this.color = vec3.fromValues(0,1,0);
			this.colorCode = "#0f0";
		}else{
			this.color = vec3.fromValues(0,0,1);
			this.colorCode = "#00f";
		}
		this.partner = [];
		
        if(this.charge > 0) this.skin.className += " positive";
        if(this.charge < 0) this.skin.className += " negative";
        camera.appendChild(this.skin);
        particles[this.id] = this;
    }
    Quark.prototype = new Particle();
    Quark.prototype.constructor = Quark;
    o.Quark = Quark;
    
    function Electron(p){
        if(!p){ p = pDefaults; }
        p.mass = .5;
        p.charge = -300;
        Particle.call(this,p);

        this.skin.className += " negative electron";
        camera.appendChild(this.skin);
        particles[this.id] = this;
    }
    Electron.prototype = new Particle();
    Electron.prototype.constructor = Electron;
    o.Electron = Electron;
    
    var lastTime = 0;
    var dTime = 0;
    var drawFrame = true;
    o.update = function(time){
        requestAnimationFrame(o.update);
        tTmp = 0;
        dTime = (time - lastTime)/1000;
        if (dTime < 1){
			player.handleKeys();
            for (i=0;i<particles.length;i++){
                particles[i].update(dTime);
                vec2.set(particles[i].force,0,0);
            }
        }
        o.temperature = tTmp/particles.length;
        lastTime = time;
    }
	
	var pressedKeys = [];
	function handleKeyDown(e){
		pressedKeys[e.keyCode] = true;
	}
	window.addEventListener("keydown",handleKeyDown);
	function handleKeyUp(e){
		pressedKeys[e.keyCode] = false;
	}
	window.addEventListener("keyup",handleKeyUp);
	
	function Player(){
		Particle.call(this);
		
		this.skin.className += " player";
        camera.appendChild(this.skin);
        particles[this.id] = this;
	}
	Player.prototype = new Particle();
	Player.prototype.constructor = Player;
	Player.prototype.handleKeys = function(){
		if (pressedKeys[39]){               //-->
            this.force[0] += 200;
        }else if (pressedKeys[37]){         //<--
            this.force[0] -= 200;
        }
        if (pressedKeys[38]){               //Up
            this.force[1] -= 200;
        }else if (pressedKeys[40]){         //Down
            this.force[1] += 200;
        }
		if (pressedKeys[32]){				//Space
			if (this.charge == 0){ 
				this.charge = -300;
				this.skin.classList.add("negative");
			}else if (this.charge == -300){ 
				this.charge = 300;
				this.skin.classList.remove("negative");
				this.skin.classList.add("positive");
			}else if (this.charge == 300){ 
				this.charge = 0;
				this.skin.classList.remove("positive");
			}
			pressedKeys[32] = false;
		}
	}
	var player = new Player();
    
    return o;
}());
requestAnimationFrame(Alchemy.update);
for(var i = 0;i < 12;i++){
    new Alchemy.Quark("up");
    new Alchemy.Quark("down");
    new Alchemy.Electron();
}