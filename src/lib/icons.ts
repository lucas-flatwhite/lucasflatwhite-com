// Phosphor is the only icon family on the site. Each glyph ships in two weights so
// hover can move from regular to bold in step with the variable type beside it.
import arrowDownBold from '@phosphor-icons/core/bold/arrow-down-bold.svg?raw';
import arrowDownRegular from '@phosphor-icons/core/regular/arrow-down.svg?raw';
import arrowUpRightBold from '@phosphor-icons/core/bold/arrow-up-right-bold.svg?raw';
import arrowUpRightRegular from '@phosphor-icons/core/regular/arrow-up-right.svg?raw';
import commandBold from '@phosphor-icons/core/bold/command-bold.svg?raw';
import commandRegular from '@phosphor-icons/core/regular/command.svg?raw';
import gameControllerBold from '@phosphor-icons/core/bold/game-controller-bold.svg?raw';
import gameControllerRegular from '@phosphor-icons/core/regular/game-controller.svg?raw';
import githubLogoBold from '@phosphor-icons/core/bold/github-logo-bold.svg?raw';
import githubLogoRegular from '@phosphor-icons/core/regular/github-logo.svg?raw';
import translateBold from '@phosphor-icons/core/bold/translate-bold.svg?raw';
import translateRegular from '@phosphor-icons/core/regular/translate.svg?raw';
import xLogoBold from '@phosphor-icons/core/bold/x-logo-bold.svg?raw';
import xLogoRegular from '@phosphor-icons/core/regular/x-logo.svg?raw';

export const icons = {
  'arrow-down': { regular: arrowDownRegular, bold: arrowDownBold },
  'arrow-up-right': { regular: arrowUpRightRegular, bold: arrowUpRightBold },
  command: { regular: commandRegular, bold: commandBold },
  'game-controller': { regular: gameControllerRegular, bold: gameControllerBold },
  'github-logo': { regular: githubLogoRegular, bold: githubLogoBold },
  translate: { regular: translateRegular, bold: translateBold },
  'x-logo': { regular: xLogoRegular, bold: xLogoBold },
} as const;

export type IconName = keyof typeof icons;
