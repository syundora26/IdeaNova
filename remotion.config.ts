import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./remotion/index.ts');
Config.setPublicDir('./remotion/public');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// CI や検証コンテナで、同梱 Chromium を使わせるための任意設定。
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
