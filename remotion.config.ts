// Configuração do Remotion: https://remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// A composição é desenhada em 1920x1080. O render final usa --scale=2 para sair em 4K nítido.
Config.setConcurrency(null);
