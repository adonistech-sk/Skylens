// On the web, Skia is CanvasKit compiled to WebAssembly and must finish loading before
// the first screen renders. The iOS app never runs this file.
import '@expo/metro-runtime';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' }).then(() => renderRootComponent(App));
