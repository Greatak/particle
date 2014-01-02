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
    var matString = '';
    var fDist = 0;
    var fMag = 0;
    var i = 0;
    var i2 = 0;
    var pDefaults = {
        velocity:vec2.fromValues(10,10),
        mass:1,
        charge:0
    };
    
    //CLASSES=====================================================================================================
    var particles = [];
    o.particles = particles;
    function Particle(p){
        if(!p){ p = pDefaults; }
        this.position = p.position||vec2.fromValues(Math.floor(Math.random()*windowSize[0]),Math.floor(Math.random()*windowSize[1]));
        this.velocity = p.velocity||vec2.clone(pDefaults.velocity);
        this.force = vec2.create();
        this.mass = p.mass||pDefaults.mass;
        this.charge = p.charge||pDefaults.charge;
        this.matrix = mat4.create();
        
        this.skin = document.createElement("div");
        this.skin.className = "particle";
        if(this.charge > 0) this.skin.className += " positive";
        if(this.charge < 0) this.skin.className += " negative";
        camera.appendChild(this.skin);
        
        this.id = particles.length;
        particles[this.id] = this;
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
    }
    Particle.prototype.draw = function(){
        matString = prefix;
        matString += "transform:";
        matString += mat4.str(this.matrix);
        this.skin.style.cssText = matString;
    }
    Particle.prototype.boundaryCollision = function(){
        if (this.position[0] < 0) {
            this.position[0] = 0;
            this.velocity[0] *= -1;
        }
        if (this.position[1] < 0) {
            this.position[1] = 0;
            this.velocity[1] *= -1;
        }
        if (this.position[0] > windowSize[0]) {
            this.position[0] = windowSize[0];
            this.velocity[0] *= -1;
        }
        if (this.position[1] > windowSize[1]) {
            this.position[1] = windowSize[1];
            this.velocity[1] *= -1;
        }
    }
    Particle.prototype.calcForces = function(t){
        for (var i2 = this.id + 1;i2 < particles.length;i2++){
            vec2.sub(pScratch,particles[i2].position,this.position);
            fDist = vec2.length(pScratch);
            fMag = ((this.charge*-1)*particles[i2].charge) / (fDist*fDist);
            if (fMag > 1000) fMag = 1000;
            vec2.set(pScratch,fMag * (pScratch[0]/fDist),fMag * (pScratch[1]/fDist))
            vec2.add(this.force,this.force,pScratch);
            vec2.sub(particles[i2].force,particles[i2].force,pScratch);
        }
    }
    o.Particle = Particle;
    
    var lastTime = 0;
    var dTime = 0;
    var drawFrame = true;
    o.update = function(time){
        requestAnimationFrame(o.update);
        if (!drawFrame) {
            dTime = (time - lastTime)/1000;
            for (i=0;i<particles.length;i++) {
                particles[i].update(dTime);
                vec2.set(particles[i].force,0,0);
            }
            drawFrame = true;
        }else{ 
            for (i=0;i<particles.length;i++) {
                particles[i].draw();
            }
            drawFrame = false;
        }
        lastTime = time;
    }
    
    return o;
}());
requestAnimationFrame(Alchemy.update);
for(var i = 0;i < 50;i++){
    new Alchemy.Particle({charge:100});
}
for(var i = 0;i < 50;i++){
    new Alchemy.Particle({charge:-200});
}