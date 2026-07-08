/**
 * Progressive Motion Blur Fragment Shader
 * Creates directional blur that increases based on a gradient mask.
 * Supports Y-axis, X-axis, and radial gradients.
 * Uses jittered sampling to reduce banding artifacts.
 */
export const progressiveBlurFrag = `
    in vec2 vTextureCoord;
    out vec4 finalColor;

    uniform sampler2D uTexture;

    uniform float uVelocity;     // Max blur strength
    uniform float uAngle;        // Blur direction (degrees)

    uniform float uStart;        // Gradient Start (0.0 - 1.0)
    uniform float uEnd;          // Gradient End (0.0 - 1.0)
    uniform int   uAxis;         // 0=Y, 1=X, 2=Radial

    // A simple pseudo-random function
    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        // 1. Calculate Gradient (The Mask)
        float t = 0.0;
        if (uAxis == 0) t = vTextureCoord.y;
        else if (uAxis == 1) t = vTextureCoord.x;
        else t = distance(vTextureCoord, vec2(0.5)) * 2.0;

        float mask = smoothstep(uStart, uEnd, t);

        // If we are in the "safe zone" (no blur), skip calculation for performance
        if (mask <= 0.01) {
            finalColor = texture(uTexture, vTextureCoord);
            return;
        }

        // 2. Setup Direction
        float rad = radians(uAngle);
        vec2 dir = vec2(cos(rad), sin(rad));

        // Calculate how much blur applies to THIS pixel
        // We divide by resolution approx (e.g. 1000) to keep velocity numbers manageable
        float currentVelocity = (uVelocity * mask) / 1000.0;

        // 3. JITTER (The Fix for Banding)
        // Get a random number 0.0 -> 1.0
        float jitter = rand(vTextureCoord);

        vec4 color = vec4(0.0);
        float totalSamples = 30.0;

        for (float i = 0.0; i < 30.0; i++) {
            // Instead of looking at 0, 1, 2...
            // We look at 0.4, 1.4, 2.4... based on the jitter.
            // This creates a "blue noise" pattern that hides the bands.

            float percent = (i + jitter) / totalSamples;

            // Map 0..1 to -0.5..0.5 (center the blur)
            float offset = (percent - 0.5) * currentVelocity;

            vec2 samplePos = vTextureCoord + (dir * offset * 100.0);
            color += texture(uTexture, samplePos);
        }

        finalColor = color / totalSamples;
    }
`;
