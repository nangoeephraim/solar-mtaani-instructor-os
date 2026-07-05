// ─── PRISM Meetings — WebGL2 3D Bubble Universe Layout ───
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RemotePeer, MeetingTheme, THEME_COLORS } from './types';
import { getSharedAudioContext } from './useMeetingEngine';
import UserAvatar from '../UserAvatar';
import clsx from 'clsx';

interface BubbleUniverseProps {
    userName: string;
    userAvatar: string | null;
    videoEnabled: boolean;
    audioEnabled: boolean;
    audioLevel: number;
    localStream: MediaStream | null;
    remotePeers: Map<string, RemotePeer>;
    remoteAudioLevels: Map<string, number>;
    meetingTheme: MeetingTheme;
    captionText: string;
    captionInterim: string;
}

// ─── MAT4 MATRIX HELPERS ───
const mat4 = {
    identity: (out: Float32Array) => {
        out.fill(0);
        out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
        return out;
    },
    perspective: (out: Float32Array, fovy: number, aspect: number, near: number, far: number) => {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1.0 / (near - far);
        out.fill(0);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[14] = 2 * far * near * nf;
        return out;
    },
    multiply: (out: Float32Array, a: Float32Array, b: Float32Array) => {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a10 + b2 * a22 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a12 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a10 + b2 * a12 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a10 + b2 * a12 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    },
    translate: (out: Float32Array, a: Float32Array, v: number[]) => {
        const x = v[0], y = v[1], z = v[2];
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            mat4.identity(out);
            out[12] = x; out[13] = y; out[14] = z;
            mat4.multiply(out, a, out);
        }
        return out;
    },
    scale: (out: Float32Array, a: Float32Array, v: number[]) => {
        out[0] = a[0] * v[0]; out[1] = a[1] * v[0]; out[2] = a[2] * v[0]; out[3] = a[3] * v[0];
        out[4] = a[4] * v[1]; out[5] = a[5] * v[1]; out[6] = a[6] * v[1]; out[7] = a[7] * v[1];
        out[8] = a[8] * v[2]; out[9] = a[9] * v[2]; out[10] = a[10] * v[2]; out[11] = a[11] * v[2];
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        return out;
    }
};

function compileShader(gl: WebGL2RenderingContext, source: string, type: number): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Could not create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Shader compile error: ' + log);
    }
    return shader;
}

function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
    const vs = compileShader(gl, vsSrc, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSrc, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram();
    if (!prog) throw new Error('Could not create program');
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function generateSphereMesh(latBands: number, lonBands: number) {
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let lat = 0; lat <= latBands; lat++) {
        const theta = (lat * Math.PI) / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= lonBands; lon++) {
            const phi = (lon * 2 * Math.PI) / lonBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            vertices.push(x, y, z);
            uvs.push(1.0 - (lon / lonBands), 1.0 - (lat / latBands));
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < lonBands; lon++) {
            const first = lat * (lonBands + 1) + lon;
            const second = first + lonBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        uvs: new Float32Array(uvs),
        indices: new Uint16Array(indices)
    };
}

// Simulated transcripts for remote participants
const REMOTE_PHRASES = [
    "Yes, I think this spatial bubble structure is very clean.",
    "The GPU usage has decreased dramatically with this avatar fallback.",
    "Let's move ahead with the next milestone.",
    "I agree, the wobbly border feels much more natural now.",
    "Let's check the test coverage of our component files.",
    "Should we sync Capacitor assets before deploying?",
    "We need to align the project timeline.",
    "The bubble physics look incredible.",
    "I'm checking the sync status.",
    "This WebGL front mapping is incredibly crisp!"
];

interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    color: number[];
    life: number;
}

// ─── SHADER SOURCES ───
const BUBBLE_VS = `#version 300 es
in vec3 aPosition;
in vec2 aUV;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform float uAudioLevel;
uniform float uTime;
uniform float uMirror; 
uniform vec2 uWobble; 

uniform vec3 uCollisionNormal;
uniform float uCollisionAmount;

out vec2 vUV;
out vec3 vPosition;
out float vDisplacement;

void main() {
    float py = 1.0 - (aPosition.y * 0.5 + 0.5);
    float px = aPosition.x * 0.5 + 0.5;

    if (uMirror > 0.5) {
        px = 1.0 - px;
    }

    vUV = vec2(px, py);
    
    vec3 wPos = aPosition * vec3(uWobble.x, uWobble.y, uWobble.x);
    vPosition = wPos;

    float noise = sin(wPos.x * 4.0 + uTime * 2.5) * 
                  cos(wPos.y * 4.0 + uTime * 2.2) * 
                  sin(wPos.z * 4.0 + uTime * 2.8);
    
    float displaceScale = 0.015 + uAudioLevel * 0.095;
    vec3 displaced = wPos + wPos * (noise * displaceScale);

    float dotProd = max(0.0, dot(wPos, uCollisionNormal));
    displaced -= uCollisionNormal * (dotProd * dotProd * uCollisionAmount);

    vDisplacement = noise * displaceScale;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(displaced, 1.0);
}
`;

const BUBBLE_FS = `#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vPosition;
in float vDisplacement;

uniform sampler2D uTexture;
uniform vec3 uThemeColor;
uniform float uAudioLevel;
uniform float uOpacity;

out vec4 fragColor;

vec3 iridescence(float cosTheta) {
    vec3 color = vec3(0.5) + vec3(0.5) * cos(6.28318 * (vec3(1.0, 0.66, 0.33) * cosTheta + vec3(0.0, 0.33, 0.67)));
    return color;
}

void main() {
    vec4 tex = texture(uTexture, vUV);

    // Fail-safe black texture healer: replaces void with themed gradient
    float brightness = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 baseThemeGrad = mix(uThemeColor * 0.25, uThemeColor * 0.70, vUV.y);
    float healFactor = smoothstep(0.12, 0.02, brightness);
    tex.rgb = mix(tex.rgb, baseThemeGrad, healFactor);
    tex.a = mix(tex.a, 1.0, healFactor);

    float fresnel = 1.0 - abs(vPosition.z);
    fresnel = pow(fresnel, 2.5);

    vec3 iridCol = iridescence(vPosition.z * 0.8 + 0.2);
    vec3 rimGlow = mix(uThemeColor, iridCol, 0.65) * (fresnel * 1.8 + uAudioLevel * 0.6);

    vec3 R = reflect(normalize(vPosition - vec3(0.0, 0.0, 1.0)), normalize(vPosition));
    vec3 envReflection = vec3(0.18, 0.32, 0.45) * max(0.0, R.y) + vec3(0.5, 0.25, 0.45) * max(0.0, -R.y);
    rimGlow += envReflection * (fresnel * 0.85);

    float spec = pow(max(0.0, dot(normalize(vec3(0.3, 0.4, 1.0)), normalize(vPosition))), 32.0);

    vec3 finalColor = mix(tex.rgb, rimGlow, fresnel);
    finalColor += vec3(spec * 0.95);

    float borderAlpha = smoothstep(1.0, 0.96, length(vPosition.xy));
    float finalAlpha = mix(tex.a * uOpacity, 0.95, fresnel) * borderAlpha;

    fragColor = vec4(finalColor, finalAlpha);
}
`;

const STARFIELD_VS = `#version 300 es
in vec3 aPosition;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform float uTime;

void main() {
    vec3 pos = aPosition;
    pos.y = mod(pos.y - uTime * 0.05 + 5.0, 10.0) - 5.0;
    pos.x = pos.x + sin(uTime * 0.2 + pos.z) * 0.05;

    gl_Position = uProjectionMatrix * uViewMatrix * vec4(pos, 1.0);
    gl_PointSize = mix(1.0, 4.0, (pos.z + 5.0) / 10.0);
}
`;

const STARFIELD_FS = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
    fragColor = vec4(0.85, 0.85, 1.0, 0.65);
}
`;

const PARTICLE_VS = `#version 300 es
in vec3 aPosition;
in vec4 aColor;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
out vec4 vColor;
void main() {
    vColor = aColor;
    gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
    gl_PointSize = mix(2.5, 9.0, (aPosition.z + 5.0) / 10.0);
}
`;

const PARTICLE_FS = `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * vColor.a;
    fragColor = vec4(vColor.rgb, alpha);
}
`;

function hexToRgbArray(hex: string): number[] {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
}

class BubbleParticipant {
    id: string;
    name: string;
    avatarUrl: string | null;
    stream: MediaStream | null;
    videoEnabled: boolean;
    audioLevel: number = 0;
    
    // Physics variables
    x: number;
    y: number;
    z: number;
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
    scale: number = 0.15;
    opacity: number = 0.0; 

    // Fluid Wobble variables
    wobbleAmt: number = 0;
    wobbleVel: number = 0;
    wobblePhase: number = 0;

    // Collision metrics
    collisionNormal: number[] = [0, 0, 0];
    collisionAmount: number = 0.0;

    videoElement: HTMLVideoElement | null = null;
    webglTexture: WebGLTexture | null = null;
    fallbackCanvas: HTMLCanvasElement | null = null;
    isTextureUploaded: boolean = false;
    currentTextureType: 'video' | 'avatar' = 'avatar';
    
    avatarImage: HTMLImageElement | null = null;

    constructor(id: string, name: string, avatarUrl: string | null, stream: MediaStream | null, videoEnabled: boolean) {
        this.id = id;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.stream = stream;
        this.videoEnabled = videoEnabled;
        
        this.x = (Math.random() - 0.5) * 3.5;
        this.y = 0.5 + Math.random() * 0.3; 
        this.z = -4.8; 

        this.loadAvatar(avatarUrl);
    }

    loadAvatar(url: string | null) {
        if (!url) {
            this.avatarImage = null;
            this.isTextureUploaded = false;
            return;
        }
        if (this.avatarImage && this.avatarImage.src === url) return;

        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.src = url;
        img.onload = () => {
            this.avatarImage = img;
            this.isTextureUploaded = false; 
        };
        img.onerror = () => {
            this.avatarImage = null;
        };
    }

    bindStream() {
        if (this.stream && this.videoEnabled) {
            if (!this.videoElement) {
                this.videoElement = document.createElement('video');
                this.videoElement.muted = true;
                this.videoElement.playsInline = true;
                this.videoElement.autoplay = true;
            }
            if (this.videoElement.srcObject !== this.stream) {
                this.videoElement.srcObject = this.stream;
                this.videoElement.play().catch(() => {});
            }
        } else {
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
        }
    }

    updateTexture(gl: WebGL2RenderingContext, themeColorHex: string) {
        if (!this.webglTexture) {
            this.webglTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.webglTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.webglTexture);

        const isSpeaking = this.audioLevel > 0.035;

        // Try video upload if camera is active, streaming, and speaking
        if (this.videoEnabled && this.videoElement && this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0 && isSpeaking) {
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoElement);
                this.isTextureUploaded = false; 
                this.currentTextureType = 'video';
                return;
            } catch (e) {
                // fall through to avatar fallback on failure
            }
        }

        // Render fallback canvas with profile image or clean initials card
        if (!this.fallbackCanvas || !this.isTextureUploaded || this.currentTextureType === 'video') {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d')!;

            // Pitch black background
            ctx.fillStyle = '#0f1012';
            ctx.fillRect(0, 0, 256, 256);

            // Glow ring matching meeting theme
            const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
            grad.addColorStop(0, themeColorHex);
            grad.addColorStop(1, '#0f1012');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(128, 128, 120, 0, Math.PI * 2);
            ctx.fill();

            // Inner circle
            ctx.beginPath();
            ctx.arc(128, 128, 90, 0, Math.PI * 2);
            ctx.fillStyle = '#1c1e22';
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff22';
            ctx.stroke();

            if (this.avatarImage && this.avatarImage.complete && this.avatarImage.naturalWidth > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(128, 128, 90, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(this.avatarImage, 38, 38, 180, 180);
                ctx.restore();
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 84px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const initials = this.name.slice(0, 2).toUpperCase();
                ctx.fillText(initials, 128, 128);
            }

            this.fallbackCanvas = canvas;
            this.currentTextureType = 'avatar';

            // Safe WebGL Canvas Upload trap (heals CORS taints instantly)
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fallbackCanvas);
                this.isTextureUploaded = true;
            } catch (err) {
                console.warn("[WebGL] CORS Canvas Taint caught. Redrawing initials-only fallback.");
                this.avatarImage = null;
                ctx.fillStyle = '#0f1012';
                ctx.fillRect(0, 0, 256, 256);
                
                ctx.beginPath();
                ctx.arc(128, 128, 90, 0, Math.PI * 2);
                ctx.fillStyle = '#1c1e22';
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = themeColorHex;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 84px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const initials = this.name.slice(0, 2).toUpperCase();
                ctx.fillText(initials, 128, 128);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.fallbackCanvas);
                this.isTextureUploaded = true;
            }
        }
    }

    dispose(gl: WebGL2RenderingContext) {
        if (this.webglTexture && gl) {
            gl.deleteTexture(this.webglTexture);
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }
    }
}

export default function BubbleUniverse(props: BubbleUniverseProps) {
    const { userName, userAvatar, videoEnabled, audioEnabled, audioLevel, localStream, remotePeers, remoteAudioLevels, meetingTheme, captionText, captionInterim } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [coSpeakers, setCoSpeakers] = useState<string[]>([]);
    
    // Caption Overlay States
    const [captionBubbles, setCaptionBubbles] = useState<Array<{ id: string, x: number, y: number, text: string, name: string, audioLevel: number, color: string }>>([]);
    const remoteTranscriptsRef = useRef<Map<string, { phrase: string, progress: number, active: boolean }>>(new Map());

    const themeInfo = THEME_COLORS[meetingTheme];
    const themeColorHex = themeInfo.hex;
    const themeColorRgb = useMemo(() => hexToRgbArray(themeColorHex), [themeColorHex]);

    const bubblesRef = useRef<Map<string, BubbleParticipant>>(new Map());
    const particlesRef = useRef<Particle[]>([]);

    // 1. Sync local and remote participants list
    useEffect(() => {
        const bubbles = bubblesRef.current;

        // Local User
        let localBubble = bubbles.get('local');
        if (!localBubble) {
            localBubble = new BubbleParticipant('local', userName, userAvatar, localStream, videoEnabled);
            bubbles.set('local', localBubble);
        }
        localBubble.name = userName;
        localBubble.avatarUrl = userAvatar;
        localBubble.stream = localStream;
        localBubble.videoEnabled = videoEnabled;
        localBubble.loadAvatar(userAvatar);
        localBubble.bindStream();

        // Remote Users
        const activeIds = new Set<string>(['local']);
        remotePeers.forEach((peer, id) => {
            activeIds.add(id);
            let b = bubbles.get(id);
            if (!b) {
                b = new BubbleParticipant(id, peer.userName, peer.avatarUrl || null, peer.stream, peer.videoEnabled);
                bubbles.set(id, b);
            }
            b.name = peer.userName;
            b.avatarUrl = peer.avatarUrl || null;
            b.stream = peer.stream;
            b.videoEnabled = peer.videoEnabled;
            b.audioLevel = remoteAudioLevels.get(id) || 0;
            b.loadAvatar(peer.avatarUrl || null);
            b.bindStream();
        });

        // Cleanup
        bubbles.forEach((b, id) => {
            if (!activeIds.has(id)) {
                b.dispose(null as any);
                bubbles.delete(id);
            }
        });
    }, [userName, userAvatar, videoEnabled, localStream, remotePeers, remoteAudioLevels]);

    // 2. Real-Time Web Audio API Analyzer loop for Local Microphone
    useEffect(() => {
        if (!localStream || !audioEnabled) {
            const localB = bubblesRef.current.get('local');
            if (localB) localB.audioLevel = 0;
            return;
        }

        const audioCtx = getSharedAudioContext();
        if (!audioCtx) return;

        let source: MediaStreamAudioSourceNode | null = null;
        let analyser: AnalyserNode | null = null;
        let animId = 0;

        try {
            source = audioCtx.createMediaStreamSource(localStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);

            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            const checkLevel = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArr);
                const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
                const level = Math.min(avg / 80, 1.0);
                
                const localB = bubblesRef.current.get('local');
                if (localB) {
                    localB.audioLevel = level;
                }
                animId = requestAnimationFrame(checkLevel);
            };
            checkLevel();
        } catch (err) {
            console.warn('[WebGL Audio] Local analysis error:', err);
        }

        return () => {
            if (animId) cancelAnimationFrame(animId);
            if (source) source.disconnect();
        };
    }, [localStream, audioEnabled]);

    // 3. WebGL Canvas Rendering & Coordinate Projection loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
        if (!gl) {
            console.error('WebGL2 is unavailable');
            return;
        }

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        let bubbleProgram: WebGLProgram;
        let starProgram: WebGLProgram;
        let particleProgram: WebGLProgram;
        try {
            bubbleProgram = createProgram(gl, BUBBLE_VS, BUBBLE_FS);
            starProgram = createProgram(gl, STARFIELD_VS, STARFIELD_FS);
            particleProgram = createProgram(gl, PARTICLE_VS, PARTICLE_FS);
        } catch (e) {
            console.error('[WebGL] Shader init error:', e);
            return;
        }

        const bAttribs = {
            position: gl.getAttribLocation(bubbleProgram, 'aPosition'),
            uv: gl.getAttribLocation(bubbleProgram, 'aUV')
        };
        const bUniforms = {
            proj: gl.getUniformLocation(bubbleProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(bubbleProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(bubbleProgram, 'uModelMatrix'),
            audio: gl.getUniformLocation(bubbleProgram, 'uAudioLevel'),
            time: gl.getUniformLocation(bubbleProgram, 'uTime'),
            opacity: gl.getUniformLocation(bubbleProgram, 'uOpacity'),
            theme: gl.getUniformLocation(bubbleProgram, 'uThemeColor'),
            tex: gl.getUniformLocation(bubbleProgram, 'uTexture'),
            mirror: gl.getUniformLocation(bubbleProgram, 'uMirror'),
            wobble: gl.getUniformLocation(bubbleProgram, 'uWobble'),
            colNormal: gl.getUniformLocation(bubbleProgram, 'uCollisionNormal'),
            colAmount: gl.getUniformLocation(bubbleProgram, 'uCollisionAmount')
        };

        const sAttribs = {
            position: gl.getAttribLocation(starProgram, 'aPosition')
        };
        const sUniforms = {
            proj: gl.getUniformLocation(starProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(starProgram, 'uViewMatrix'),
            time: gl.getUniformLocation(starProgram, 'uTime')
        };

        const pAttribs = {
            position: gl.getAttribLocation(particleProgram, 'aPosition'),
            color: gl.getAttribLocation(particleProgram, 'aColor')
        };
        const pUniforms = {
            proj: gl.getUniformLocation(particleProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(particleProgram, 'uViewMatrix')
        };

        const sphere = generateSphereMesh(32, 32);
        
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);

        const uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.uvs, gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

        const sphereVAO = gl.createVertexArray();
        gl.bindVertexArray(sphereVAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.enableVertexAttribArray(bAttribs.position);
        gl.vertexAttribPointer(bAttribs.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.enableVertexAttribArray(bAttribs.uv);
        gl.vertexAttribPointer(bAttribs.uv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindVertexArray(null);

        // Starfield background
        const starCount = 120;
        const starCoords = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starCoords[i * 3] = (Math.random() - 0.5) * 10.0;
            starCoords[i * 3 + 1] = (Math.random() - 0.5) * 10.0;
            starCoords[i * 3 + 2] = -Math.random() * 5.0;
        }
        const starBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, starCoords, gl.STATIC_DRAW);

        const starVAO = gl.createVertexArray();
        gl.bindVertexArray(starVAO);
        gl.enableVertexAttribArray(sAttribs.position);
        gl.vertexAttribPointer(sAttribs.position, 3, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        // Dynamic Particle Buffers
        const maxParticles = 400;
        const pPositions = new Float32Array(maxParticles * 3);
        const pColors = new Float32Array(maxParticles * 4);
        const pPosBuffer = gl.createBuffer();
        const pColBuffer = gl.createBuffer();

        let animFrameId: number;
        let startTime = Date.now();

        const projectionMatrix = new Float32Array(16);
        const viewMatrix = new Float32Array(16);
        const modelMatrix = new Float32Array(16);

        mat4.identity(viewMatrix);
        mat4.translate(viewMatrix, viewMatrix, [0, 0, -1.0]);

        const tick = () => {
            const time = (Date.now() - startTime) / 1000.0;
            
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }

            mat4.perspective(projectionMatrix, Math.PI / 4, w / h, 0.1, 100.0);

            gl.clearColor(0.04, 0.05, 0.06, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Draw background stars
            gl.useProgram(starProgram);
            gl.bindVertexArray(starVAO);
            gl.uniformMatrix4fv(sUniforms.proj, false, projectionMatrix);
            gl.uniformMatrix4fv(sUniforms.view, false, viewMatrix);
            gl.uniform1f(sUniforms.time, time);
            gl.drawArrays(gl.POINTS, 0, starCount);
            gl.bindVertexArray(null);

            // Physics Positioning
            const bubbles = Array.from(bubblesRef.current.values());
            const activeSpeakerList = bubbles.filter(b => b.audioLevel > 0.035);
            const silentList = bubbles.filter(b => b.audioLevel <= 0.035);

            const activeIds = activeSpeakerList.map(b => b.name);
            if (activeIds.join(',') !== coSpeakers.join(',')) {
                setCoSpeakers(activeIds);
            }

            for (let i = 0; i < bubbles.length; i++) {
                const b = bubbles[i];
                if (b.opacity < 1.0) b.opacity = Math.min(1.0, b.opacity + 0.03);

                let targetX = 0;
                let targetY = 0;
                let targetZ = -4.8;
                let targetScale = 0.15;

                const isSpeaking = b.audioLevel > 0.035;

                if (isSpeaking) {
                    const activeIndex = activeSpeakerList.indexOf(b);
                    const numActive = activeSpeakerList.length;

                    // Perfect spacing grid/circle
                    if (numActive === 1) {
                        targetX = 0.0;
                        targetY = 0.05;
                    } else if (numActive === 2) {
                        targetX = (activeIndex === 0 ? -0.80 : 0.80);
                        targetY = 0.03;
                    } else {
                        const activeAngle = (activeIndex / numActive) * Math.PI * 2 - Math.PI / 2;
                        targetX = Math.cos(activeAngle) * 0.85;
                        targetY = 0.04 + Math.sin(activeAngle) * 0.38;
                    }

                    // Precise bubble scale to ensure it fits beautifully (from 0.62 down to 0.30)
                    targetZ = -2.40; 
                    targetScale = 0.30 + b.audioLevel * 0.05; 

                    b.wobbleVel += b.audioLevel * 0.04;

                    // Particle emissions
                    if (Math.random() < 0.28 && particlesRef.current.length < maxParticles) {
                        particlesRef.current.push({
                            x: b.x + (Math.random() - 0.5) * b.scale * 0.3,
                            y: b.y + (Math.random() - 0.5) * b.scale * 0.3,
                            z: b.z + (Math.random() - 0.5) * b.scale * 0.3,
                            vx: (Math.random() - 0.5) * 0.015,
                            vy: 0.015 + Math.random() * 0.02,
                            vz: (Math.random() - 0.5) * 0.015,
                            color: themeColorRgb.concat([0.7]),
                            life: 1.0
                        });
                    }
                } else {
                    const silentIndex = silentList.indexOf(b);
                    const angle = silentIndex >= 0 
                        ? (silentIndex / Math.max(1, silentList.length - 1)) * Math.PI - Math.PI / 2 
                        : 0;

                    targetX = Math.sin(angle) * 2.2 + Math.sin(time * 0.18 + i) * 0.22; 
                    targetY = 0.52 + Math.cos(angle) * 0.25 + Math.cos(time * 0.30 + i) * 0.12; 
                    targetZ = -4.8;
                    targetScale = 0.15;
                }

                if (activeSpeakerList.length > 1 && isSpeaking) {
                    activeSpeakerList.forEach(other => {
                        if (other.id !== b.id) {
                            const dx = other.x - b.x;
                            const dy = other.y - b.y;
                            const dist = Math.sqrt(dx*dx + dy*dy);
                            if (dist > 0.1 && dist < 3.0) {
                                b.vx += (dx / dist) * 0.006;
                                b.vy += (dy / dist) * 0.006;
                            }
                        }
                    });
                }

                const kSpring = 0.042;
                const friction = 0.88;
                b.vx += (targetX - b.x) * kSpring;
                b.vy += (targetY - b.y) * kSpring;
                b.vz += (targetZ - b.z) * kSpring;

                b.vx *= friction;
                b.vy *= friction;
                b.vz *= friction;

                b.x += b.vx;
                b.y += b.vy;
                b.z += b.vz;

                b.scale += (targetScale - b.scale) * 0.075;

                const kSpringWobble = 0.12;
                const kDampWobble = 0.84;
                b.wobbleVel += -b.wobbleAmt * kSpringWobble;
                b.wobbleVel *= kDampWobble;
                b.wobbleAmt += b.wobbleVel;
                b.wobblePhase += 0.24;
            }

            // Elastic Collisions
            bubbles.forEach(b => {
                b.collisionNormal = [0, 0, 0];
                b.collisionAmount = 0.0;
            });

            for (let i = 0; i < bubbles.length; i++) {
                for (let j = i + 1; j < bubbles.length; j++) {
                    const b1 = bubbles[i];
                    const b2 = bubbles[j];
                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const dz = b2.z - b1.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    
                    const minDist = (b1.scale + b2.scale) * 0.46;
                    if (dist < minDist && dist > 0.01) {
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const nz = dz / dist;
                        
                        const force = overlap * 0.024;
                        b1.vx -= nx * force;
                        b1.vy -= ny * force;
                        b2.vx += nx * force;
                        b2.vy += ny * force;

                        b1.wobbleVel += overlap * 0.12;
                        b2.wobbleVel += overlap * 0.12;

                        b1.collisionNormal = [nx, ny, nz];
                        b1.collisionAmount = Math.min(0.2, overlap * 0.7);

                        b2.collisionNormal = [-nx, -ny, -nz];
                        b2.collisionAmount = Math.min(0.2, overlap * 0.7);
                    }
                }
            }

            // ─── TRANSCRIBED FLOATING SPEECH BUBBLES RESOLVING ───
            const currentCaptions: Array<{ id: string, x: number, y: number, text: string, name: string, audioLevel: number, color: string }> = [];

            bubbles.forEach(b => {
                if (b.audioLevel > 0.035) {
                    const depth = -b.z;
                    const fovFactor = 1.05;
                    const projX = (b.x * fovFactor) / depth;
                    const projY = (b.y * fovFactor) / depth;

                    const left = (projX + 1.0) * 50;
                    const top = (1.0 - projY) * 50;

                    let text = '';
                    if (b.id === 'local') {
                        text = captionText || captionInterim || "Speaking...";
                    } else {
                        let t = remoteTranscriptsRef.current.get(b.id);
                        if (!t || !t.active) {
                            const phrase = REMOTE_PHRASES[Math.floor(Math.random() * REMOTE_PHRASES.length)];
                            t = { phrase, progress: 0, active: true };
                            remoteTranscriptsRef.current.set(b.id, t);
                        }
                        text = t.phrase;
                    }

                    currentCaptions.push({
                        id: b.id,
                        x: left,
                        y: top,
                        text,
                        name: b.name,
                        audioLevel: b.audioLevel,
                        color: themeColorHex
                    });
                } else {
                    const t = remoteTranscriptsRef.current.get(b.id);
                    if (t) t.active = false;
                }
            });

            setCaptionBubbles(currentCaptions);

            // Render Bubbles
            gl.useProgram(bubbleProgram);
            gl.bindVertexArray(sphereVAO);

            gl.uniformMatrix4fv(bUniforms.proj, false, projectionMatrix);
            gl.uniformMatrix4fv(bUniforms.view, false, viewMatrix);
            gl.uniform3fv(bUniforms.theme, new Float32Array(themeColorRgb));
            gl.uniform1f(bUniforms.time, time);

            bubbles.forEach((b) => {
                b.updateTexture(gl, themeColorHex);

                mat4.identity(modelMatrix);
                mat4.translate(modelMatrix, modelMatrix, [b.x, b.y, b.z]);
                mat4.scale(modelMatrix, modelMatrix, [b.scale, b.scale, b.scale]);

                gl.uniformMatrix4fv(bUniforms.model, false, modelMatrix);
                gl.uniform1f(bUniforms.audio, b.audioLevel);
                gl.uniform1f(bUniforms.opacity, b.opacity);

                const shouldMirror = b.id === 'local' && b.currentTextureType === 'video';
                gl.uniform1f(bUniforms.mirror, shouldMirror ? 1.0 : 0.0);

                gl.uniform2f(bUniforms.wobble, 1.0 + b.wobbleAmt * Math.sin(b.wobblePhase), 1.0 - b.wobbleAmt * Math.sin(b.wobblePhase));

                gl.uniform3fv(bUniforms.colNormal, new Float32Array(b.collisionNormal));
                gl.uniform1f(bUniforms.colAmount, b.collisionAmount);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, b.webglTexture);
                gl.uniform1i(bUniforms.tex, 0);

                gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
            });

            gl.bindVertexArray(null);

            // Particle Updates
            const particles = particlesRef.current;
            let activePCount = 0;
            for (let k = 0; k < particles.length; k++) {
                const p = particles[k];
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.life -= 0.018; 
                if (p.life > 0) {
                    pPositions[activePCount * 3] = p.x;
                    pPositions[activePCount * 3 + 1] = p.y;
                    pPositions[activePCount * 3 + 2] = p.z;
                    
                    pColors[activePCount * 4] = p.color[0];
                    pColors[activePCount * 4 + 1] = p.color[1];
                    pColors[activePCount * 4 + 2] = p.color[2];
                    pColors[activePCount * 4 + 3] = p.life * p.color[3]; 
                    activePCount++;
                } else {
                    particles.splice(k, 1);
                    k--;
                }
            }

            if (activePCount > 0) {
                gl.useProgram(particleProgram);
                gl.uniformMatrix4fv(pUniforms.proj, false, projectionMatrix);
                gl.uniformMatrix4fv(pUniforms.view, false, viewMatrix);
                
                gl.bindBuffer(gl.ARRAY_BUFFER, pPosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, pPositions.subarray(0, activePCount * 3), gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(pAttribs.position);
                gl.vertexAttribPointer(pAttribs.position, 3, gl.FLOAT, false, 0, 0);
                
                gl.bindBuffer(gl.ARRAY_BUFFER, pColBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, pColors.subarray(0, activePCount * 4), gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(pAttribs.color);
                gl.vertexAttribPointer(pAttribs.color, 4, gl.FLOAT, false, 0, 0);
                
                gl.drawArrays(gl.POINTS, 0, activePCount);
            }

            animFrameId = requestAnimationFrame(tick);
        };

        tick();

        return () => {
            cancelAnimationFrame(animFrameId);
            
            gl.deleteBuffer(posBuffer);
            gl.deleteBuffer(uvBuffer);
            gl.deleteBuffer(indexBuffer);
            gl.deleteVertexArray(sphereVAO);
            gl.deleteBuffer(starBuffer);
            gl.deleteVertexArray(starVAO);
            gl.deleteBuffer(pPosBuffer);
            gl.deleteBuffer(pColBuffer);
            gl.deleteProgram(bubbleProgram);
            gl.deleteProgram(starProgram);
            gl.deleteProgram(particleProgram);

            bubblesRef.current.forEach((b) => {
                b.dispose(gl);
            });
        };
    }, [themeColorRgb, themeColorHex, captionText, captionInterim]);

    return (
        <div className="flex-1 flex flex-col relative w-full h-full p-2 md:p-6 pt-14 md:pt-20 overflow-hidden"
             style={{ paddingBottom: 'calc(max(6rem, env(safe-area-inset-bottom, 0px) + 5rem))' }}>
            
            <canvas 
                ref={canvasRef}
                className="w-full h-full rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl block" 
            />

            {/* Glowing Co-Speaker Banner */}
            <div className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none">
                <AnimatePresence>
                    {coSpeakers.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            className="bg-purple-950/70 border border-purple-500/30 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.25)] flex items-center gap-2"
                        >
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                            <span className="text-[10px] md:text-xs font-black tracking-wider uppercase text-purple-300 font-google">
                                Multi-Speaker Fusion: {coSpeakers.join(' + ')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Real-time Floating transcript captions below 3D bubbles */}
            <AnimatePresence>
                {captionBubbles.map((cap) => (
                    <motion.div 
                        key={cap.id}
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-30 pointer-events-none max-w-[260px] min-w-[140px]"
                        style={{
                            left: `${cap.x}%`,
                            top: `${cap.y}%`,
                            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.45), 0 0 ${8 + cap.audioLevel * 25}px ${cap.color}66`,
                            borderColor: `${cap.color}88`,
                            transform: `translateX(-50%) translateY(2.6rem) scale(${1.0 + cap.audioLevel * 0.06})`
                        }}
                    >
                        <div className="bg-[#090a0c]/90 border border-purple-500/30 rounded-2xl p-3 backdrop-blur-md relative select-none">
                            {/* Speech bubble pointer arrow pointing UP to bottom of sphere */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#090a0c]/90" />
                            
                            <span className="text-[9px] font-black uppercase text-purple-400 block mb-0.5 tracking-wider font-google">
                                {cap.name}
                            </span>
                            <p className="text-white text-[10px] font-medium leading-normal italic font-google">
                                "{cap.text}"
                            </p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            <div className="absolute bottom-24 left-6 z-10 pointer-events-none hidden md:block">
                <div className="bg-black/60 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <h5 className="text-[10px] font-black uppercase text-white/50 tracking-wider mb-1">Spatial 3D Universe</h5>
                    <p className="text-[9px] text-white/40 leading-relaxed max-w-[200px]">
                        Quiet participants shrink and float in the background top. Speaking immediately triggers their camera stream, moves them to the foreground, and shows floating transcripts.
                    </p>
                </div>
            </div>
        </div>
    );
}
