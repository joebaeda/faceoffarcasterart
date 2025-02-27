'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebglState {
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    clock: THREE.Clock | null;
    texture: THREE.Texture | THREE.VideoTexture | null;
    particleTexture: THREE.Texture | null;
    geometryParticles: THREE.InstancedBufferGeometry | null;
    particlesMesh: THREE.Mesh | null;
    hoverPlate: THREE.Mesh | null;
    raycaster: THREE.Raycaster | null;
    mouse: THREE.Vector2 | null;
    raf: number | null;
    timeout_Debounce: NodeJS.Timeout | null;
    width: number;
    height: number;
    totalPoints: number;
    visiblePoints: number;
    arrayOfColors: Float32Array | null;
    threshold: number;
}

interface TailState {
    array: { x: number; y: number; age: number; force: number }[];
    size: number;
    maxAge: number;
    radius: number;
    red: number;
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    texture: THREE.Texture | null;
    on: boolean;
}

const useAnimationFrames = (creatorPFP: string) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const webglRef = useRef<WebglState>({
        scene: null,
        camera: null,
        renderer: null,
        clock: null,
        texture: null,
        particleTexture: null,
        geometryParticles: null,
        particlesMesh: null,
        hoverPlate: null,
        raycaster: null,
        mouse: null,
        raf: null,
        timeout_Debounce: null,
        width: 100,
        height: 100,
        totalPoints: 0,
        visiblePoints: 0,
        arrayOfColors: null,
        threshold: 30,
    });
    const tailRef = useRef<TailState>({
        array: [],
        size: 80,
        maxAge: 70,
        radius: 0.08,
        red: 255,
        canvas: null,
        ctx: null,
        texture: null,
        on: false,
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        const textureUrl = creatorPFP;
        const isVideo = false;
        const svgString = `<svg width="1000" height="1000" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" transform="scale(1 -1)">
      <path d="M257.778 155.556h484.444v688.889h-71.111V528.889h-.697c-7.86-87.212-81.156-155.556-170.414-155.556s-162.554 68.344-170.414 155.556h-.697v315.556h-71.111z" fill="#fff" />
      <path d="m128.889 253.333 28.889 97.778h24.444v395.556c-12.273 0-22.222 9.949-22.222 22.222v26.667h-4.444c-12.273 0-22.223 9.949-22.223 22.222v26.667h248.889v-26.667c0-12.273-9.949-22.222-22.222-22.222h-4.444v-26.667c0-12.273-9.95-22.222-22.223-22.222h-26.666V253.333zm546.667 493.334c-12.274 0-22.223 9.949-22.223 22.222v26.667h-4.444c-12.273 0-22.222 9.949-22.222 22.222v26.667h248.889v-26.667c0-12.273-9.95-22.222-22.223-22.222h-4.444v-26.667c0-12.273-9.949-22.222-22.222-22.222V351.111h24.444L880 253.333H702.222v493.334z" fill="#fff" />
    </svg>`;
        const svgDataUrl = 'data:image/svg+xml,' + encodeURIComponent(svgString);

        const webgl = webglRef.current;
        const tail = tailRef.current;

        // Scene setup
        webgl.scene = new THREE.Scene();
        webgl.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
        webgl.camera.position.z = 180;
        webgl.renderer = new THREE.WebGLRenderer({ alpha: true });
        webgl.renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        webgl.renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(webgl.renderer.domElement);
        webgl.clock = new THREE.Clock(true);

        const vertexShader = `
      precision highp float;
      attribute float pindex;
      attribute vec3 position;
      attribute vec3 offset;
      attribute vec2 uv;
      attribute float angle;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uTime;
      uniform float uRandom;
      uniform float uDepth;
      uniform float uSize;
      uniform vec2 uTextureSize;
      uniform sampler2D uTexture;
      uniform sampler2D uTouch;
      varying vec2 vPUv;
      varying vec2 vUv;
      
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec3 permute(vec3 x) {
        return mod289(((x * 34.0) + 1.0) * x);
      }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float random(float n) {
        return fract(sin(n) * 43758.5453123);
      }
      
      void main() {
        vUv = uv;
        vec2 puv = offset.xy / uTextureSize;
        vPUv = puv;
        vec4 colA = texture2D(uTexture, puv);
        float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
        vec3 displaced = offset;
        displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
        float rndz = (random(pindex) + snoise(vec2(pindex * 0.1, uTime * 0.1)));
        displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
        displaced.xy -= uTextureSize * 0.5;
        float t = texture2D(uTouch, puv).r;
        displaced.z += t * -40.0 * rndz;
        displaced.x += cos(angle) * t * 40.0 * rndz;
        displaced.y += sin(angle) * t * 40.0 * rndz;
        float psize = (snoise(vec2(uTime, pindex) * 0.5) + 2.0);
        psize *= max(grey, 0.2);
        psize *= uSize;
        vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
        mvPosition.xyz += position * psize;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
        const fragmentShader = `
      precision highp float;
      uniform sampler2D uTexture;
      uniform sampler2D uParticleTexture;
      varying vec2 vPUv;
      varying vec2 vUv;
      void main() {
        vec4 particleShape = texture2D(uParticleTexture, vUv);
        vec4 color = texture2D(uTexture, vPUv);
        gl_FragColor = vec4(color.rgb, particleShape.a);
      }
    `;

        const loadTexture = () => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.crossOrigin = '';
            if (isVideo) {
                const video = document.createElement('video');
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.crossOrigin = 'anonymous';
                video.src = textureUrl;
                video.onloadeddata = () => {
                    video.play();
                    webgl.texture = new THREE.VideoTexture(video);
                    textureLoader.load(svgDataUrl, (particleTexture) => {
                        webgl.particleTexture = particleTexture;
                        setup();
                    });
                };
            } else {
                textureLoader.load(textureUrl, (texture) => {
                    webgl.texture = texture;
                    textureLoader.load(svgDataUrl, (particleTexture) => {
                        webgl.particleTexture = particleTexture;
                        setup();
                    });
                });
            }
        };

        const pixelExtraction = () => {
            webgl.totalPoints = webgl.width * webgl.height;
            webgl.visiblePoints = 0;
            if (!isVideo && webgl.texture instanceof THREE.Texture) {
                const img = webgl.texture.image as HTMLImageElement;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                canvas.width = webgl.width;
                canvas.height = webgl.height;
                ctx.scale(1, -1);
                ctx.drawImage(img, 0, 0, webgl.width, webgl.height * -1);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                webgl.arrayOfColors = Float32Array.from(imgData.data);
                for (let i = 0; i < webgl.totalPoints; i++) {
                    if (webgl.arrayOfColors[i * 4 + 0] > webgl.threshold) {
                        webgl.visiblePoints++;
                    }
                }
            }
        };

        const initParticles = () => {
            webgl.geometryParticles = new THREE.InstancedBufferGeometry();
            const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
            positions.setXYZ(0, -0.5, 0.5, 0.0);
            positions.setXYZ(1, 0.5, 0.5, 0.0);
            positions.setXYZ(2, -0.5, -0.5, 0.0);
            positions.setXYZ(3, 0.5, -0.5, 0.0);
            webgl.geometryParticles.setAttribute('position', positions);
            const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
            uvs.setXYZ(0, 0.0, 0.0, 0);
            uvs.setXYZ(1, 1.0, 0.0, 0);
            uvs.setXYZ(2, 0.0, 1.0, 0);
            uvs.setXYZ(3, 1.0, 1.0, 0);
            webgl.geometryParticles.setAttribute('uv', uvs);
            webgl.geometryParticles.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));
            const offsets = new Float32Array(webgl.totalPoints * 3);
            const indices = new Uint16Array(webgl.totalPoints);
            const angles = new Float32Array(webgl.totalPoints);
            let j = 0;
            for (let i = 0; i < webgl.totalPoints; i++) {
                if (!isVideo || (isVideo && i % 2 === 0)) {
                    offsets[j * 3 + 0] = i % webgl.width;
                    offsets[j * 3 + 1] = Math.floor(i / webgl.width);
                    indices[j] = i;
                    angles[j] = Math.random() * Math.PI;
                    j++;
                }
            }
            webgl.geometryParticles.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
            webgl.geometryParticles.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));
            webgl.geometryParticles.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
            const uniforms = {
                uTime: { value: 0 },
                uRandom: { value: 3.0 },
                uDepth: { value: 30.0 },
                uSize: { value: 2.0 },
                uTextureSize: { value: new THREE.Vector2(webgl.width, webgl.height) },
                uTexture: { value: webgl.texture },
                uParticleTexture: { value: webgl.particleTexture },
                uTouch: { value: null as THREE.Texture | null },
                uAlphaCircle: { value: 0.0 },
                uAlphaSquare: { value: 1.0 },
                uCircleORsquare: { value: 0.0 },
            };
            const materialParticles = new THREE.RawShaderMaterial({
                uniforms,
                vertexShader,
                fragmentShader,
                depthTest: false,
                transparent: true,
            });
            webgl.particlesMesh = new THREE.Mesh(webgl.geometryParticles, materialParticles);
        };

        const initTail = () => {
            tail.array = [];
            tail.canvas = document.createElement('canvas');
            tail.canvas.width = tail.canvas.height = tail.size;
            tail.ctx = tail.canvas.getContext('2d') as CanvasRenderingContext2D;
            tail.ctx.fillStyle = 'black';
            tail.ctx.fillRect(0, 0, tail.canvas.width, tail.canvas.height);
            tail.texture = new THREE.Texture(tail.canvas);
            if (webgl.particlesMesh) {
                (webgl.particlesMesh.material as THREE.RawShaderMaterial).uniforms.uTouch.value = tail.texture;
            }
        };

        const initRaycaster = () => {
            const geometryPlate = new THREE.PlaneGeometry(webgl.width, webgl.height, 1, 1);
            const materialPlate = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false });
            materialPlate.visible = false;
            webgl.hoverPlate = new THREE.Mesh(geometryPlate, materialPlate);
            webgl.scene!.add(webgl.hoverPlate);
            webgl.raycaster = new THREE.Raycaster();
            webgl.mouse = new THREE.Vector2(0, 0);
            window.addEventListener('mousemove', onMouseMove, false);
        };

        const onMouseMove = (event: MouseEvent) => {
            if (webgl.renderer && webgl.raycaster && webgl.mouse && webgl.camera && webgl.particlesMesh) {
                webgl.mouse.x = (event.clientX / webgl.renderer.domElement.clientWidth) * 2 - 1;
                webgl.mouse.y = -(event.clientY / webgl.renderer.domElement.clientHeight) * 2 + 1;
                webgl.raycaster.setFromCamera(webgl.mouse, webgl.camera);
                const intersects = webgl.raycaster.intersectObjects([webgl.hoverPlate!]);
                webgl.particlesMesh.rotation.y = webgl.mouse.x / 8;
                webgl.particlesMesh.rotation.x = -webgl.mouse.y / 8;
                if (intersects[0] && tail.on) buildTail(intersects[0].uv as THREE.Vector2);
            }
        };

        const buildTail = (uv: THREE.Vector2) => {
            let force = 0;
            const last = tail.array[tail.array.length - 1];
            if (last) {
                const dx = last.x - uv.x;
                const dy = last.y - uv.y;
                const dd = dx * dx + dy * dy;
                force = Math.min(dd * 10000, 1);
            }
            tail.array.push({ x: uv.x, y: uv.y, age: 0, force });
        };

        const animate = () => {
            if (webgl.particlesMesh && webgl.renderer && webgl.scene && webgl.camera && webgl.clock) {
                (webgl.particlesMesh.material as THREE.RawShaderMaterial).uniforms.uTime.value += webgl.clock.getDelta();
                if (tail.on) drawTail();
                tail.texture!.needsUpdate = true;
                webgl.texture!.needsUpdate = true;
                webgl.renderer.render(webgl.scene, webgl.camera);
                webgl.raf = requestAnimationFrame(animate);
            }
        };

        const drawTail = () => {
            if (!tail.ctx || !tail.canvas) return; // Guard against null
            tail.ctx!.fillStyle = 'black'; // Non-null assertion after guard
            tail.ctx!.fillRect(0, 0, tail.canvas.width, tail.canvas.height);
            tail.array.forEach((point, i) => {
                point.age++;
                if (point.age > tail.maxAge) {
                    tail.array.splice(i, 1);
                } else {
                    const pos = { x: point.x * tail.size, y: (1 - point.y) * tail.size };
                    let intensity = 1;
                    if (point.age < tail.maxAge * 0.3) {
                        intensity = easeOutSine(point.age / (tail.maxAge * 0.3), 0, 1, 1);
                    } else {
                        intensity = easeOutSine(1 - (point.age - tail.maxAge * 0.3) / (tail.maxAge * 0.7), 0, 1, 1);
                    }
                    intensity *= point.force;
                    const radius = tail.size * tail.radius * intensity;
                    const grd = tail.ctx!.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);
                    grd.addColorStop(0, `rgba(${tail.red}, 255, 255, 0.2)`);
                    grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
                    tail.ctx!.beginPath();
                    tail.ctx!.fillStyle = grd;
                    tail.ctx!.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                    tail.ctx!.fill();
                }
            });
        };

        const easeOutSine = (t: number, b: number, c: number, d: number): number =>
            c * Math.sin((t / d) * (Math.PI / 2)) + b;

        const resize = () => {
            if (webgl.camera && webgl.renderer && webgl.particlesMesh) {
                let f = 0.1;
                webgl.camera.aspect = containerRef.current!.clientWidth / containerRef.current!.clientHeight;
                webgl.camera.updateProjectionMatrix();
                webgl.renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
                if (window.innerWidth / window.innerHeight < 2.8) f = -0.2;
                const fovHeight = 2 * Math.tan((webgl.camera.fov * Math.PI) / 180 / 2) * webgl.camera.position.z;
                const scale = fovHeight / webgl.height + f;
                webgl.particlesMesh.scale.set(scale, scale, 1);
                if (webgl.hoverPlate) webgl.hoverPlate.scale.set(scale, scale, 1);
            }
        };

        const setup = () => {
            pixelExtraction();
            initParticles();
            initTail();
            initRaycaster();
            if (webgl.scene && webgl.particlesMesh) {
                webgl.scene.add(webgl.particlesMesh);
            }
            animate();
            tail.on = true;
            window.addEventListener('resize', handleResize);
            resize();
        };

        const handleResize = () => {
            clearTimeout(webgl.timeout_Debounce!);
            webgl.timeout_Debounce = setTimeout(resize, 50);
        };

        loadTexture();

        // Cleanup
        return () => {
            if (webgl.raf) cancelAnimationFrame(webgl.raf);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            if (webgl.renderer && webgl.renderer.domElement && containerRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                containerRef.current.removeChild(webgl.renderer.domElement);
            }
            webgl.scene = null;
            webgl.camera = null;
            webgl.renderer = null;
            webgl.particlesMesh = null;
            webgl.geometryParticles = null;
            webgl.texture = null;
            webgl.particleTexture = null;
        };
    }, [creatorPFP]);

    return { containerRef };
};

export default useAnimationFrames;