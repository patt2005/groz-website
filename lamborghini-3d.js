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
        this.drivingMode = false;
        this.drivingStartTime = 0;
        this.originalPosition = { x: 0, y: -1, z: 0 };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.loadModel();
        if (this.canvasId !== 'driving-3d-canvas') {
            this.setupEventListeners();
        }
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a); // Lighter background
        
        // Add fog for depth with better parameters
        this.scene.fog = new THREE.Fog(0x1a1a1a, 30, 100);
        
        // Add enhanced ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            transparent: true,
            opacity: 0.7,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add particle system for atmospheric effects
        this.createParticleSystem();
        
        // Add environment reflections
        this.setupEnvironmentReflections();
    }
    
    createParticleSystem() {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color1 = new THREE.Color(0xff6b35);
        const color2 = new THREE.Color(0x00d4ff);
        
        for (let i = 0; i < particleCount; i++) {
            // Random positions in a sphere around the scene
            const radius = Math.random() * 100 + 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Random colors between orange and blue
            const mixRatio = Math.random();
            const color = color1.clone().lerp(color2, mixRatio);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    pos.y += sin(time + position.x * 0.01) * 2.0;
                    pos.x += cos(time + position.z * 0.01) * 1.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distance = length(gl_PointCoord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = 1.0 - distance * 2.0;
                    gl_FragColor = vec4(vColor, alpha * 0.3);
                }
            `,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        
        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem);
    }
    
    setupEnvironmentReflections() {
        // Create a simple environment map for reflections
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });
        
        const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
        this.scene.add(cubeCamera);
        
        this.envMap = cubeRenderTarget.texture;
        this.cubeCamera = cubeCamera;
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
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 2.5; // Much higher exposure for brightness
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = false; // Disable for more dramatic lighting
        
        // Optimize for brightness and vibrancy
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.gammaFactor = 1.8; // Adjusted for better contrast
    }
    
    setupLights() {
        // Much brighter ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);
        
        // Very bright main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.bias = -0.0001;
        this.scene.add(directionalLight);
        
        // Additional directional lights for even coverage
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight2.position.set(-10, 8, -5);
        this.scene.add(directionalLight2);
        
        const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight3.position.set(0, -5, 10);
        this.scene.add(directionalLight3);
        
        // Bright orange accent light
        const accentLight = new THREE.PointLight(0xff6b35, 5, 30);
        accentLight.position.set(-5, 5, 5);
        this.scene.add(accentLight);
        
        // Bright blue rim light
        const rimLight = new THREE.PointLight(0x00d4ff, 4, 25);
        rimLight.position.set(5, 3, -5);
        this.scene.add(rimLight);
        
        // Additional colorful accent lights
        const pinkLight = new THREE.PointLight(0xff69b4, 3, 20);
        pinkLight.position.set(-8, 8, 0);
        this.scene.add(pinkLight);
        
        const greenLight = new THREE.PointLight(0x00ff88, 3, 20);
        greenLight.position.set(8, 8, 0);
        this.scene.add(greenLight);
        
        // Front headlight simulation - much brighter
        const frontLight = new THREE.SpotLight(0xffffff, 4);
        frontLight.position.set(0, 2, 8);
        frontLight.target.position.set(0, 0, 0);
        frontLight.angle = Math.PI / 3;
        frontLight.penumbra = 0.1;
        frontLight.decay = 1;
        frontLight.distance = 40;
        this.scene.add(frontLight);
        this.scene.add(frontLight.target);
        
        // Enhanced spot light for dramatic effect
        const spotLight = new THREE.SpotLight(0xffffff, 3.0);
        spotLight.position.set(0, 15, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.1;
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
        
        // Bright car underlight for glow effect
        const underLight = new THREE.PointLight(0xff6b35, 4, 15);
        underLight.position.set(0, -1.5, 0);
        this.scene.add(underLight);
        
        // Store lights for animation
        this.lights = {
            accent: accentLight,
            rim: rimLight,
            front: frontLight,
            under: underLight,
            pink: pinkLight,
            green: greenLight
        };
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
        
        // Set a timeout to show fallback car if model doesn't load in 5 seconds
        const loadTimeout = setTimeout(() => {
            console.log('Model loading timeout - creating fallback car');
            this.createFallbackCar();
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }, 5000);
        
        console.log('Starting to load Lamborghini model from:', './models/lamborghini_venevo.glb');
        
        loader.load(
            './models/lamborghini_venevo.glb', // Your Lamborghini Veneno model
            (gltf) => {
                clearTimeout(loadTimeout); // Clear the timeout since model loaded
                console.log('Lamborghini model loaded successfully:', gltf);
                this.car = gltf.scene;
                
                // Scale and position the car
                this.car.scale.set(1.5, 1.5, 1.5);
                this.car.position.set(0, -1, 0);
                
                // Enable shadows and enhance materials
                this.car.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Dramatically enhance materials for bright, colorful look
                        if (child.material) {
                            child.material.envMapIntensity = 3.0;
                            
                            // Apply environment map for reflections
                            if (this.envMap) {
                                child.material.envMap = this.envMap;
                            }
                            
                            // Convert all materials to MeshStandardMaterial if they aren't already
                            if (!child.material.isMeshStandardMaterial) {
                                const oldColor = child.material.color || new THREE.Color(0xff6b35);
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: oldColor,
                                    metalness: 0.9,
                                    roughness: 0.1,
                                    envMap: this.envMap,
                                    envMapIntensity: 3.0
                                });
                                child.material = newMaterial;
                            }
                            
                            // Make everything highly reflective and bright
                            child.material.metalness = 1.0;
                            child.material.roughness = 0.05;
                            
                            // Add emissive properties for car lights/details
                            if (child.name && (child.name.includes('light') || child.name.includes('headlight'))) {
                                child.material.emissive = new THREE.Color(0xffffff);
                                child.material.emissiveIntensity = 1.5;
                            }
                            
                            // Enhance and brighten car body materials
                            if (child.material.color) {
                                const color = child.material.color;
                                
                                // Make car body bright and colorful
                                if (color.r > 0.3 || color.g > 0.3 || color.b > 0.3) {
                                    // Brighten the base color significantly
                                    color.multiplyScalar(2.0);
                                    
                                    // Add strong emissive glow
                                    child.material.emissive = color.clone().multiplyScalar(0.3);
                                    child.material.emissiveIntensity = 0.5;
                                    
                                    // Perfect mirror-like finish
                                    child.material.metalness = 1.0;
                                    child.material.roughness = 0.02;
                                }
                                
                                // Special handling for specific parts
                                if (child.name) {
                                    const name = child.name.toLowerCase();
                                    if (name.includes('body') || name.includes('chassis')) {
                                        // Make body bright orange/copper like reference
                                        child.material.color = new THREE.Color(0xff8844);
                                        child.material.emissive = new THREE.Color(0x441100);
                                        child.material.emissiveIntensity = 0.6;
                                    } else if (name.includes('wheel') || name.includes('rim')) {
                                        // Keep wheels darker but still reflective
                                        child.material.color = new THREE.Color(0x333333);
                                        child.material.metalness = 0.9;
                                        child.material.roughness = 0.1;
                                    } else if (name.includes('glass') || name.includes('window')) {
                                        // Make glass more transparent and reflective
                                        child.material.transparent = true;
                                        child.material.opacity = 0.3;
                                        child.material.metalness = 0.1;
                                        child.material.roughness = 0.0;
                                    }
                                }
                            }
                            
                            // Force material update
                            child.material.needsUpdate = true;
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
                clearTimeout(loadTimeout); // Clear the timeout since we got an error
                console.error('Error loading Lamborghini model:', error);
                console.error('Model path attempted:', './models/lamborghini_venevo.glb');
                console.error('Current URL:', window.location.href);
                
                const loadingText = document.querySelector('.loading-indicator p');
                if (loadingText) {
                    loadingText.textContent = 'Creating Lamborghini...';
                }
                
                // Create a fallback 3D car if model fails to load
                this.createFallbackCar();
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }
        );
    }
    
    createFallbackCar() {
        console.log('Creating bright Lamborghini fallback car...');
        
        // Create a Lamborghini-style 3D car as fallback
        const carGroup = new THREE.Group();
        
        // Main car body - sleek and low
        const bodyGeometry = new THREE.BoxGeometry(5, 0.8, 2.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff8844,
            metalness: 1.0,
            roughness: 0.05,
            emissive: 0x441100,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        body.receiveShadow = true;
        carGroup.add(body);
        
        // Front section - more angular
        const frontGeometry = new THREE.BoxGeometry(1.5, 0.6, 2);
        const frontMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffaa55,
            metalness: 1.0,
            roughness: 0.02,
            emissive: 0x552200,
            emissiveIntensity: 0.4
        });
        const front = new THREE.Mesh(frontGeometry, frontMaterial);
        front.position.set(3, 0.3, 0);
        front.castShadow = true;
        carGroup.add(front);
        
        // Cockpit/Cabin - low profile
        const cockpitGeometry = new THREE.BoxGeometry(2.8, 1.2, 1.8);
        const cockpitMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc6622,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x331100,
            emissiveIntensity: 0.25
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(-0.5, 1.2, 0);
        cockpit.castShadow = true;
        carGroup.add(cockpit);
        
        // Rear spoiler
        const spoilerGeometry = new THREE.BoxGeometry(0.3, 0.8, 2.5);
        const spoilerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        const spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
        spoiler.position.set(-2.8, 1.5, 0);
        spoiler.castShadow = true;
        carGroup.add(spoiler);
        
        // Wheels - more detailed
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.3
        });
        
        const rimGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.45, 16);
        const rimMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 1.0,
            roughness: 0.1
        });
        
        const wheelPositions = [
            [-1.8, 0, 1.4],  // Front left
            [1.8, 0, 1.4],   // Front right
            [-1.8, 0, -1.4], // Rear left
            [1.8, 0, -1.4]   // Rear right
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            wheel.rotation.z = Math.PI / 2;
            rim.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            rim.position.set(...pos);
            wheel.castShadow = true;
            rim.castShadow = true;
            carGroup.add(wheel);
            carGroup.add(rim);
        });
        
        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headlightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(3.6, 0.4, 0.6);
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(3.6, 0.4, -0.6);
        
        carGroup.add(leftHeadlight);
        carGroup.add(rightHeadlight);
        
        // Exhaust flames effect
        const exhaustGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const exhaustMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 0.8
        });
        const exhaust1 = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        const exhaust2 = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust1.position.set(-3, 0.2, 0.4);
        exhaust2.position.set(-3, 0.2, -0.4);
        carGroup.add(exhaust1);
        carGroup.add(exhaust2);
        
        carGroup.position.set(0, -1, 0);
        carGroup.scale.set(0.8, 0.8, 0.8); // Scale to fit nicely
        
        this.car = carGroup;
        this.scene.add(this.car);
        this.isLoaded = true;
        
        console.log('Bright Lamborghini fallback car created successfully!');
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
        
        // Handle resize specifically for this canvas
        const resizeObserver = new ResizeObserver(() => {
            this.onWindowResize();
        });
        const canvas = document.getElementById('hero-3d-canvas');
        if (canvas) {
            resizeObserver.observe(canvas);
        }
        
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
                this.startDrivingAnimation();
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
    
    startDrivingAnimation() {
        if (!this.car) return;
        
        this.drivingMode = !this.drivingMode;
        this.drivingStartTime = Date.now();
        
        if (this.drivingMode) {
            // Disable auto-rotate during driving
            this.controls.autoRotate = false;
            // Store original position
            this.originalPosition = {
                x: this.car.position.x,
                y: this.car.position.y,
                z: this.car.position.z
            };
        } else {
            // Reset position when stopping
            this.car.position.set(this.originalPosition.x, this.originalPosition.y, this.originalPosition.z);
            this.car.rotation.set(0, 0, 0);
            if (this.autoRotate) {
                this.controls.autoRotate = true;
            }
        }
    }
    
    updateDrivingAnimation() {
        if (!this.drivingMode || !this.car) return;
        
        const elapsed = (Date.now() - this.drivingStartTime) / 1000;
        
        // Driving path - figure 8 pattern across the screen
        const speed = 2.0;
        const pathRadius = 8;
        
        // Calculate position along figure-8 path
        const t = elapsed * speed * 0.5;
        const x = pathRadius * Math.sin(t);
        const z = pathRadius * Math.sin(t) * Math.cos(t);
        const y = this.originalPosition.y + Math.sin(elapsed * 4) * 0.3; // Gentle bouncing
        
        this.car.position.set(x, y, z);
        
        // Car rotation to follow the path direction
        const dx = pathRadius * Math.cos(t) * speed * 0.5;
        const dz = pathRadius * (Math.cos(t) * Math.cos(t) - Math.sin(t) * Math.sin(t)) * speed * 0.5;
        this.car.rotation.y = Math.atan2(dx, dz) + Math.PI;
        
        // Add slight tilting during turns
        const turnIntensity = Math.abs(dx) * 0.1;
        this.car.rotation.z = dx > 0 ? -turnIntensity : turnIntensity;
        
        // Animate lights during driving
        if (this.lights) {
            const pulseIntensity = 1 + Math.sin(elapsed * 8) * 0.3;
            this.lights.front.intensity = 2 * pulseIntensity;
            this.lights.under.intensity = 1.5 * pulseIntensity;
            
            // Move accent lights to follow the car
            this.lights.accent.position.set(x - 3, 5, z + 3);
            this.lights.rim.position.set(x + 3, 3, z - 3);
        }
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
        
        // Update driving animation if active
        this.updateDrivingAnimation();
        
        // Add floating animation to the car (only when not driving)
        if (this.car && this.isLoaded && !this.drivingMode) {
            this.car.position.y = this.originalPosition.y + Math.sin(Date.now() * 0.001) * 0.1;
            
            // Add subtle rotation when auto-rotate is off
            if (!this.controls.autoRotate) {
                this.car.rotation.y += 0.002;
            }
        }
        
        // Enhanced dynamic lighting effects
        if (this.lights && !this.drivingMode) {
            const time = Date.now() * 0.001;
            
            // Main accent lights with stronger pulsing
            this.lights.accent.intensity = 5 + Math.sin(time * 2) * 2;
            this.lights.rim.intensity = 4 + Math.sin(time * 3) * 1.5;
            this.lights.under.intensity = 4 + Math.sin(time * 4) * 1;
            
            // Colorful accent lights with rotation and pulsing
            this.lights.pink.intensity = 3 + Math.sin(time * 2.5) * 1;
            this.lights.green.intensity = 3 + Math.sin(time * 1.8) * 1;
            
            // Rotate colorful lights around the car
            const radius = 8;
            this.lights.pink.position.x = Math.cos(time * 0.5) * radius;
            this.lights.pink.position.z = Math.sin(time * 0.5) * radius;
            this.lights.green.position.x = Math.cos(time * 0.5 + Math.PI) * radius;
            this.lights.green.position.z = Math.sin(time * 0.5 + Math.PI) * radius;
            
            // Front light intensity variation
            this.lights.front.intensity = 4 + Math.sin(time * 4) * 1;
        }
        
        // Update particle system
        if (this.particleSystem && this.particleSystem.material.uniforms) {
            this.particleSystem.material.uniforms.time.value = Date.now() * 0.001;
            this.particleSystem.rotation.y += 0.001;
        }
        
        // Update environment reflections occasionally
        if (this.cubeCamera && this.car && this.isLoaded) {
            // Update every 60 frames for performance
            if (Date.now() % 1000 < 16) {
                this.cubeCamera.position.copy(this.car.position);
                this.cubeCamera.update(this.renderer, this.scene);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Driving Section Lamborghini Class
class LamborghiniDriving extends Lamborghini3D {
    constructor() {
        super();
        this.canvasId = 'driving-3d-canvas';
        this.loadingId = 'driving-loading';
        this.isDriving = true; // Always in driving mode
        this.drivingPath = 'straight'; // Straight line driving for road section
        this.init();
        this.setupEventListeners();
    }
    
    setupCamera() {
        const canvas = document.getElementById(this.canvasId);
        this.camera = new THREE.PerspectiveCamera(
            60, // Wider field of view for driving
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 4, 8); // Side view for driving
    }
    
    setupRenderer() {
        const canvas = document.getElementById(this.canvasId);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 2.5;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = false;
        
        this.renderer.shadowMap.autoUpdate = true;
        this.renderer.gammaFactor = 1.8;
    }
    
    setupControls() {
        // No user controls for driving section - automatic camera
        this.controls = null;
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        const loadingIndicator = document.getElementById(this.loadingId);
        
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Set a timeout to show fallback car if model doesn't load in 3 seconds (faster for driving section)
        const loadTimeout = setTimeout(() => {
            console.log('DRIVING Model loading timeout - creating fallback car');
            this.createFallbackCar();
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }, 3000);
        
        console.log('Starting to load DRIVING Lamborghini model from:', './models/lamborghini_venevo.glb');
        
        loader.load(
            './models/lamborghini_venevo.glb',
            (gltf) => {
                clearTimeout(loadTimeout); // Clear the timeout since model loaded
                console.log('DRIVING Lamborghini model loaded successfully:', gltf);
                this.car = gltf.scene;
                
                // Scale and position for driving section
                this.car.scale.set(1.2, 1.2, 1.2);
                this.car.position.set(0, -1, 0);
                this.car.rotation.y = Math.PI * 0.15; // Slight angle for dynamic look
                
                // Apply same material enhancements
                this.car.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        if (child.material) {
                            child.material.envMapIntensity = 3.0;
                            if (this.envMap) {
                                child.material.envMap = this.envMap;
                            }
                            
                            if (!child.material.isMeshStandardMaterial) {
                                const oldColor = child.material.color || new THREE.Color(0xff6b35);
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: oldColor,
                                    metalness: 0.9,
                                    roughness: 0.1,
                                    envMap: this.envMap,
                                    envMapIntensity: 3.0
                                });
                                child.material = newMaterial;
                            }
                            
                            child.material.metalness = 1.0;
                            child.material.roughness = 0.05;
                            
                            if (child.material.color) {
                                const color = child.material.color;
                                if (color.r > 0.3 || color.g > 0.3 || color.b > 0.3) {
                                    color.multiplyScalar(2.0);
                                    child.material.emissive = color.clone().multiplyScalar(0.3);
                                    child.material.emissiveIntensity = 0.5;
                                    child.material.metalness = 1.0;
                                    child.material.roughness = 0.02;
                                }
                            }
                            
                            child.material.needsUpdate = true;
                        }
                    }
                });
                
                this.scene.add(this.car);
                this.isLoaded = true;
                
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                console.log('Driving Lamborghini loaded successfully!');
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                const loadingText = document.querySelector(`#${this.loadingId} p`);
                if (loadingText) {
                    loadingText.textContent = `Loading Lamborghini... ${percent}%`;
                }
            },
            (error) => {
                clearTimeout(loadTimeout); // Clear the timeout since we got an error
                console.error('Error loading DRIVING Lamborghini model:', error);
                console.error('DRIVING Model path attempted:', './models/lamborghini_venevo.glb');
                console.error('DRIVING Current URL:', window.location.href);
                
                const loadingText = document.querySelector(`#${this.loadingId} p`);
                if (loadingText) {
                    loadingText.textContent = 'Creating Lamborghini...';
                }
                
                this.createFallbackCar();
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }
        );
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        const time = Date.now() * 0.001;
        
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Continuous straight-line driving animation
        if (this.car && this.isLoaded) {
            // Gentle bouncing while driving
            this.car.position.y = -1 + Math.sin(time * 3) * 0.1;
            
            // Slight left-right sway for realism
            this.car.position.x = Math.sin(time * 1.5) * 0.3;
            
            // Engine vibration
            this.car.rotation.z = Math.sin(time * 20) * 0.005;
        }
        
        // Dynamic lighting effects
        if (this.lights) {
            this.lights.accent.intensity = 5 + Math.sin(time * 2) * 2;
            this.lights.rim.intensity = 4 + Math.sin(time * 3) * 1.5;
            this.lights.under.intensity = 4 + Math.sin(time * 4) * 1;
            this.lights.front.intensity = 4 + Math.sin(time * 4) * 1;
            
            if (this.lights.pink && this.lights.green) {
                this.lights.pink.intensity = 3 + Math.sin(time * 2.5) * 1;
                this.lights.green.intensity = 3 + Math.sin(time * 1.8) * 1;
            }
        }
        
        // Update particle system
        if (this.particleSystem && this.particleSystem.material.uniforms) {
            this.particleSystem.material.uniforms.time.value = time;
            this.particleSystem.rotation.y += 0.001;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const canvas = document.getElementById(this.canvasId);
        if (canvas) {
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Handle resize specifically for driving canvas
        const resizeObserver = new ResizeObserver(() => {
            this.onWindowResize();
        });
        const canvas = document.getElementById(this.canvasId);
        if (canvas) {
            resizeObserver.observe(canvas);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize hero section Lamborghini
    const heroCanvas = document.getElementById('hero-3d-canvas');
    if (heroCanvas) {
        new Lamborghini3D();
    }
    
    // Initialize driving section Lamborghini
    const drivingCanvas = document.getElementById('driving-3d-canvas');
    if (drivingCanvas) {
        new LamborghiniDriving();
    }
});

export default Lamborghini3D;