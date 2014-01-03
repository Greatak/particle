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
    
    var pScratch = vec2.create();
    var pScratch2 = vec2.create();
    var pScratch3 = vec2.create();
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
        this.force = vec2.create();
        this.mass = p.mass||pDefaults.mass;
        this.charge = p.charge||pDefaults.charge;
        this.matrix = mat4.create();
        this.size = p.size||pDefaults.size;
        
        this.skin = document.createElement("div");
        this.skin.className = "particle";
        if(this.charge > 0) this.skin.className += " positive";
        if(this.charge < 0) this.skin.className += " negative";
        camera.appendChild(this.skin);
        
        this.id = particles.length;
        particles[this.id] = this;
        return this;
    }
    Particle.prototype.update = function(t){
        this.boundaryCollision();
        this.calcForces();
        fMag = t/this.mass;
        vec2.scaleAndAdd(this.velocity,this.velocity,this.force,fMag);
        vec2.scaleAndAdd(this.position,this.position,this.velocity,t);
        mat4.identity(this.matrix);
        this.matrix[12] = this.position[0];
        this.matrix[13] = this.position[1];
        matString = prefix;
        matString += "transform:";
        matString += mat4.str(this.matrix);
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
            fMag = this.size + particles[i2].size;
            if (fMag > fDist){                                                          //Whoops! They hit
                fMag -= fDist;
                vec2.scale(pScratch2,pScratch,1/fMag);
                vec2.sub(this.velocity,this.velocity,pScratch2);
                vec2.add(particles[i2].velocity,particles[i2].velocity,pScratch2);
                vec2.scale(this.velocity,this.velocity,this.resolveCollision(particles[i2]));
            }
            fMag = ((this.charge*-1)*particles[i2].charge) / (fDist*fDist);
            if (fMag > 1000) fMag = 1000;
            vec2.set(pScratch,fMag * (pScratch[0]/fDist),fMag * (pScratch[1]/fDist))
            vec2.add(this.force,this.force,pScratch);
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
    }
    Quark.prototype.resolveCollision = function(target){
        if(target instanceof Quark){ return 0; }
        else{ return 0.9; }
    }
    Quark.prototype = new Particle();
    Quark.prototype.constructor = Quark;
    o.Quark = Quark;
    
    function Electron(p){
        if(!p){ p = pDefaults; }
        p.mass = .5;
        p.charge = -100;
        Particle.call(this,p);
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
        if (dTime < 10){
            for (i=0;i<particles.length;i++){
                particles[i].update(dTime);
                vec2.set(particles[i].force,0,0);
            }
        }
        o.temperature = tTmp/particles.length;
        lastTime = time;
    }
    
    return o;
}());
requestAnimationFrame(Alchemy.update);
for(var i = 0;i < 20;i++){
    new Alchemy.Quark("up");
    new Alchemy.Quark("down");
    new Alchemy.Electron();
}