import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Lamborghini3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.car = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.isLoaded = false;
        this.autoRotate = true;
        this.lightsOn = true;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.loadModel();
        this.setupEventListeners();
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
        
        // Add ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a1a,
            transparent: true,
            opacity: 0.5
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        this.scene.add(ground);
    }
    
    setupCamera() {
        const canvas = document.getElementById('hero-3d-canvas');
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 3, 5);
    }
    
    setupRenderer() {
        const canvas = document.getElementById('hero-3d-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
        
        // Orange accent light
        const accentLight = new THREE.PointLight(0xff6b35, 2, 20);
        accentLight.position.set(-5, 5, 5);
        this.scene.add(accentLight);
        
        // Blue rim light
        const rimLight = new THREE.PointLight(0x00d4ff, 1, 15);
        rimLight.position.set(5, 3, -5);
        this.scene.add(rimLight);
        
        // Spot light for dramatic effect
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 15, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.2;
        spotLight.castShadow = true;
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = 2;
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        const loadingIndicator = document.querySelector('.loading-indicator');
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        
        loader.load(
            './models/lamborghini_venevo.glb', // Your Lamborghini Veneno model
            (gltf) => {
                this.car = gltf.scene;
                
                // Scale and position the car
                this.car.scale.set(1.5, 1.5, 1.5);
                this.car.position.set(0, -1, 0);
                
                // Enable shadows
                this.car.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Enhance materials
                        if (child.material) {
                            child.material.envMapIntensity = 1;
                        }
                    }
                });
                
                // Set up animations if they exist
                if (gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.car);
                    gltf.animations.forEach((clip) => {
                        this.mixer.clipAction(clip).play();
                    });
                }
                
                this.scene.add(this.car);
                this.isLoaded = true;
                
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
                
                console.log('Lamborghini loaded successfully!');
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                const loadingText = document.querySelector('.loading-indicator p');
                if (loadingText) {
                    loadingText.textContent = `Loading Lamborghini... ${percent}%`;
                }
            },
            (error) => {
                console.error('Error loading Lamborghini model:', error);
                const loadingText = document.querySelector('.loading-indicator p');
                if (loadingText) {
                    loadingText.textContent = 'Error loading model. Using fallback...';
                }
                
                // Create a fallback 3D car if model fails to load
                this.createFallbackCar();
                loadingIndicator.style.display = 'none';
            }
        );
    }
    
    createFallbackCar() {
        // Create a simple 3D car as fallback
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(4, 1, 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b35 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        carGroup.add(body);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.8);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xd64527 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 1.4, 0);
        carGroup.add(roof);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const positions = [
            [-1.5, 0, 1.2],
            [1.5, 0, 1.2],
            [-1.5, 0, -1.2],
            [1.5, 0, -1.2]
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            carGroup.add(wheel);
        });
        
        carGroup.position.set(0, -1, 0);
        this.car = carGroup;
        this.scene.add(this.car);
        this.isLoaded = true;
    }
    
    setupEventListeners() {
        // Car control buttons
        const controlBtns = document.querySelectorAll('.car-control-btn');
        controlBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleCarControl(action);
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse interaction for manual rotation
        const canvas = document.getElementById('hero-3d-canvas');
        canvas.addEventListener('mouseenter', () => {
            this.controls.autoRotate = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (this.autoRotate) {
                this.controls.autoRotate = true;
            }
        });
    }
    
    handleCarControl(action) {
        if (!this.isLoaded) return;
        
        switch (action) {
            case 'rotate':
                this.autoRotate = !this.autoRotate;
                this.controls.autoRotate = this.autoRotate;
                break;
                
            case 'lights':
                this.toggleLights();
                break;
                
            case 'doors':
                this.animateCarFeature();
                break;
        }
    }
    
    toggleLights() {
        this.lightsOn = !this.lightsOn;
        const lights = this.scene.children.filter(child => 
            child.type === 'PointLight' || child.type === 'SpotLight'
        );
        
        lights.forEach(light => {
            light.intensity = this.lightsOn ? light.userData.originalIntensity || light.intensity : 0;
            if (!light.userData.originalIntensity) {
                light.userData.originalIntensity = light.intensity;
            }
        });
    }
    
    animateCarFeature() {
        if (!this.car) return;
        
        // Create a bounce animation
        const originalY = this.car.position.y;
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const bounceHeight = Math.sin(progress * Math.PI * 4) * 0.5;
            
            this.car.position.y = originalY + bounceHeight;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.car.position.y = originalY;
            }
        };
        
        animate();
    }
    
    onWindowResize() {
        const canvas = document.getElementById('hero-3d-canvas');
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        if (this.controls) {
            this.controls.update();
        }
        
        // Add floating animation to the car
        if (this.car && this.isLoaded) {
            this.car.position.y += Math.sin(Date.now() * 0.001) * 0.002;
            
            // Add subtle rotation when auto-rotate is off
            if (!this.controls.autoRotate) {
                this.car.rotation.y += 0.002;
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if the canvas exists
    const canvas = document.getElementById('hero-3d-canvas');
    if (canvas) {
        new Lamborghini3D();
    }
});

export default Lamborghini3D;