// The Moon with its real phase. Each pixel of NASA's near-side image is lit as a sphere
// from the direction the phase angle gives, so the terminator falls where it really is.
import { Canvas, Circle, ImageShader, Shader, Skia, useImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';
import { images } from '../../design/images';

const SHADER = `
uniform shader moon;
uniform float2 size;
uniform float phase;
uniform float rollRad;
half4 main(float2 p) {
  float2 n = (p - size * 0.5) / (size * 0.5);
  float r2 = dot(n, n);
  if (r2 > 1.0) return half4(0.0);
  float z = sqrt(1.0 - r2);
  float cr = cos(rollRad), sr = sin(rollRad);
  float2 q = float2(cr * n.x + sr * n.y, -sr * n.x + cr * n.y);
  // Phase 0 is new, 180 full. The Sun lies on +x of the rolled frame.
  float a = phase * 0.0174533;
  float3 sun = float3(sin(a), 0.0, -cos(a));
  float light = dot(float3(q, z), sun);
  float lit = smoothstep(-0.10, 0.30, light);
  half4 c = moon.eval(p);
  float earthshine = 0.035;
  float edge = smoothstep(1.0, 0.985, sqrt(r2));
  return half4(c.rgb * (earthshine + (1.0 - earthshine) * lit) * edge, edge);
}`;

export function MoonDisc({ size, phaseAngle, waxing }: { size: number; phaseAngle: number; waxing: boolean }) {
  const image = useImage(images.moonDisc);
  const effect = useMemo(() => Skia.RuntimeEffect.Make(SHADER), []);
  // Northern view: waxing is lit on the right. Illumination phase runs 0 to 180.
  const phase = waxing ? phaseAngle : 360 - phaseAngle;
  const uniforms = { size: [size, size], phase, rollRad: waxing ? 0 : Math.PI };
  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel="The Moon as it appears now">
      {image && effect ? (
        <Canvas style={{ width: size, height: size }}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2}>
            <Shader source={effect} uniforms={uniforms}>
              <ImageShader image={image} fit="cover" x={0} y={0} width={size} height={size} />
            </Shader>
          </Circle>
        </Canvas>
      ) : null}
    </View>
  );
}
