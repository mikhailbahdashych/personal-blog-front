import { Block, neofetchBlock } from './commands';
import { TerminalData } from './vfs';

/**
 * One rendered exchange: an optional echoed prompt line and its output.
 * The boot transcript and live commands share this shape, so the renderer
 * never knows which is which.
 */
export interface Entry {
  id: string;
  prompt?: { cwd: string; text: string };
  blocks: Block[];
}

/**
 * What the terminal shows before anyone types. The terminal is a toy beside
 * the real content now, so the boot stays small: a motd line and a pre-run
 * `neofetch`. Pure function of the data — no clock, no randomness — so the
 * server and the client render it identically.
 */
export function initialEntries(data: TerminalData): Entry[] {
  const motd: Entry[] =
    data.lastActivityIso === null
      ? []
      : [
          {
            id: 'boot-motd',
            blocks: [
              {
                kind: 'lines',
                lines: [
                  {
                    text: `Last login: ${data.lastActivityIso.slice(0, 10)} from 127.0.0.1`,
                    tone: 'dim',
                  },
                ],
              },
            ],
          },
        ];

  return [
    ...motd,
    {
      id: 'boot-neofetch',
      prompt: { cwd: '~', text: 'neofetch' },
      blocks: [neofetchBlock(data)],
    },
  ];
}
