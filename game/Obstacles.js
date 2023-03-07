import { Group, Vector3 } from '../../libs/three137/three.module.js';
import { GLTFLoader } from '../../libs/three137/GLTFLoader.js';
import { Explosion } from './Explosion.js';

class Obstacles{
    constructor(game){
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
		this.game = game;
		this.scene = game.scene;
        this.loadStar();
		this.loadBomb();
		this.tmpPos = new Vector3();
        this.explosions = [];
    }

    loadStar(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        this.ready = false;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'star.glb',
			// called when the resource is loaded
			gltf => {

                this.star = gltf.scene.children[0];

                this.star.name = 'star';

				if (this.bomb !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

                this.loadingBar.update('star', xhr.loaded, xhr.total );
			
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}	

    loadBomb(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'bomb.glb',
			// called when the resource is loaded
			gltf => {

                this.bomb = gltf.scene.children[0];

                if (this.star !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('bomb', xhr.loaded, xhr.total );
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}

	initialize(){
        this.obstacles = [];
        
        const obstacle = new Group();
        
        obstacle.add(this.star);
        
        this.bomb.rotation.x = -Math.PI*0.5;
        this.bomb.position.y = 7.5;
        obstacle.add(this.bomb);

        let rotate=true;

        for(let y=5; y>-8; y-=2.5){
            rotate = !rotate;
            if (y==0) continue;
            const bomb = this.bomb.clone();
            bomb.rotation.x = (rotate) ? -Math.PI*0.5 : 0;
            bomb.position.y = y;
            obstacle.add(bomb);
        
        }
        this.obstacles.push(obstacle);

        this.scene.add(obstacle);

        for(let i=0; i<3; i++){
            
            const obstacle1 = obstacle.clone();
            
            this.scene.add(obstacle1);
            this.obstacles.push(obstacle1);

        }

        this.reset();

		this.ready = true;
    }

    removeExplosion( explosion ){
        const index = this.explosions.indexOf( explosion );
        if (index != -1) this.explosions.indexOf(index, 1);
    }

    reset(){
        this.obstacleSpawn = { pos: 20, offset: 5 };
        this.obstacles.forEach( obstacle => this.respawnObstacle(obstacle) );
        let count;
        while( this.explosions.length>0 && count<100){
            this.explosions[0].onComplete();
            count++;
        }
    }

    respawnObstacle( obstacle ){
        this.obstacleSpawn.pos += 30;
        const offset = (Math.random()*2 - 1) * this.obstacleSpawn.offset;
        this.obstacleSpawn.offset += 0.2;
        obstacle.position.set(0, offset, this.obstacleSpawn.pos );
        obstacle.children[0].rotation.y = Math.random() * Math.PI * 2;
		obstacle.userData.hit = false;
		obstacle.children.forEach( child => {
			child.visible = true;
		});
    }

	update(pos, time){
        let collisionObstacle;

        this.obstacles.forEach( obstacle =>{
            obstacle.children[0].rotateY(0.01);
            const relativePosZ = obstacle.position.z-pos.z;
            if (Math.abs(relativePosZ)<2){
                collisionObstacle = obstacle;
            }
            if (relativePosZ<-20){
                this.respawnObstacle(obstacle); 
            }
        });

       
        if (collisionObstacle!==undefined){
			let minDist = Infinity;
			collisionObstacle.children.some( child => {
				child.getWorldPosition(this.tmpPos);
				const dist = this.tmpPos.distanceToSquared(pos);
				if (dist<minDist) minDist = dist;
                if (dist<5 && !collisionObstacle.userData.hit){
					collisionObstacle.userData.hit = true;
					console.log(`Closest obstacle is ${minDist.toFixed(2)}`);
					this.hit(child);
                    return true;
                }
            })
            
        }

        this.explosions.forEach( explosion => {
            explosion.update( time );
        });
    }

	hit(obj){
		if (obj.name=='star'){
			obj.visible = false;
			this.game.incScore();
        }else{
            this.explosions.push( new Explosion(obj, this) );
			this.game.decLives();
        }
	}
}

export { Obstacles };