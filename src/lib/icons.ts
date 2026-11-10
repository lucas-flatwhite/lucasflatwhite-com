// Phosphor is the only icon family on the site. Each glyph ships in two weights so
// hover can move from regular to bold in step with the variable type beside it.
import arrowDownBold from '@phosphor-icons/core/bold/arrow-down-bold.svg?raw';
import arrowDownRegular from '@phosphor-icons/core/regular/arrow-down.svg?raw';
import arrowUpRightBold from '@phosphor-icons/core/bold/arrow-up-right-bold.svg?raw';
import arrowUpRightRegular from '@phosphor-icons/core/regular/arrow-up-right.svg?raw';
import bookOpenBold from '@phosphor-icons/core/bold/book-open-bold.svg?raw';
import bookOpenRegular from '@phosphor-icons/core/regular/book-open.svg?raw';
import checkBold from '@phosphor-icons/core/bold/check-bold.svg?raw';
import checkRegular from '@phosphor-icons/core/regular/check.svg?raw';
import commandBold from '@phosphor-icons/core/bold/command-bold.svg?raw';
import commandRegular from '@phosphor-icons/core/regular/command.svg?raw';
import downloadSimpleBold from '@phosphor-icons/core/bold/download-simple-bold.svg?raw';
import downloadSimpleRegular from '@phosphor-icons/core/regular/download-simple.svg?raw';
import envelopeBold from '@phosphor-icons/core/bold/envelope-bold.svg?raw';
import envelopeRegular from '@phosphor-icons/core/regular/envelope.svg?raw';
import exportBold from '@phosphor-icons/core/bold/export-bold.svg?raw';
import exportRegular from '@phosphor-icons/core/regular/export.svg?raw';
import gameControllerBold from '@phosphor-icons/core/bold/game-controller-bold.svg?raw';
import gameControllerRegular from '@phosphor-icons/core/regular/game-controller.svg?raw';
import githubLogoBold from '@phosphor-icons/core/bold/github-logo-bold.svg?raw';
import githubLogoRegular from '@phosphor-icons/core/regular/github-logo.svg?raw';
import handWavingBold from '@phosphor-icons/core/bold/hand-waving-bold.svg?raw';
import handWavingFill from '@phosphor-icons/core/fill/hand-waving-fill.svg?raw';
import handWavingRegular from '@phosphor-icons/core/regular/hand-waving.svg?raw';
import hammerBold from '@phosphor-icons/core/bold/hammer-bold.svg?raw';
import hammerRegular from '@phosphor-icons/core/regular/hammer.svg?raw';
import identificationCardBold from '@phosphor-icons/core/bold/identification-card-bold.svg?raw';
import identificationCardRegular from '@phosphor-icons/core/regular/identification-card.svg?raw';
import umbrellaSimpleBold from '@phosphor-icons/core/bold/umbrella-simple-bold.svg?raw';
import umbrellaSimpleRegular from '@phosphor-icons/core/regular/umbrella-simple.svg?raw';
import xBold from '@phosphor-icons/core/bold/x-bold.svg?raw';
import xRegular from '@phosphor-icons/core/regular/x.svg?raw';
import xLogoBold from '@phosphor-icons/core/bold/x-logo-bold.svg?raw';
import xLogoRegular from '@phosphor-icons/core/regular/x-logo.svg?raw';

export const icons = {
  'arrow-down': { regular: arrowDownRegular, bold: arrowDownBold },
  'arrow-up-right': { regular: arrowUpRightRegular, bold: arrowUpRightBold },
  'book-open': { regular: bookOpenRegular, bold: bookOpenBold },
  check: { regular: checkRegular, bold: checkBold },
  command: { regular: commandRegular, bold: commandBold },
  'download-simple': { regular: downloadSimpleRegular, bold: downloadSimpleBold },
  envelope: { regular: envelopeRegular, bold: envelopeBold },
  export: { regular: exportRegular, bold: exportBold },
  'game-controller': { regular: gameControllerRegular, bold: gameControllerBold },
  'github-logo': { regular: githubLogoRegular, bold: githubLogoBold },
  'hand-waving': { regular: handWavingRegular, bold: handWavingBold },
  hammer: { regular: hammerRegular, bold: hammerBold },
  'identification-card': { regular: identificationCardRegular, bold: identificationCardBold },
  'umbrella-simple': { regular: umbrellaSimpleRegular, bold: umbrellaSimpleBold },
  x: { regular: xRegular, bold: xBold },
  'x-logo': { regular: xLogoRegular, bold: xLogoBold },
} as const;

export type IconName = keyof typeof icons;

/** The one filled glyph: the big waving hand on the /hi/ intro's yellow screen. */
export const handWavingSolid = handWavingFill;
