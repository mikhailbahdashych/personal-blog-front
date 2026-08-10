import {
  FileContent,
  TerminalData,
  VfsDir,
  VfsFile,
  VfsNode,
  formatCwd,
  getNode,
  resolvePath,
  visibleChildren,
} from './vfs';

/**
 * The command layer: pure functions from (context, input line) to output
 * blocks plus optional side effects. Nothing here touches the DOM — the
 * Terminal component applies effects and a renderer turns blocks into JSX,
 * which is what keeps this whole layer unit-testable.
 */

export type Tone = 'default' | 'dim' | 'error' | 'ok';

export interface TextLine {
  text: string;
  tone?: Tone;
}

export interface LsEntry {
  name: string;
  kind: 'dir' | 'file';
  href: string | null;
  title: string | null;
  meta: string | null;
}

export type Block =
  | { kind: 'lines'; lines: TextLine[] }
  | { kind: 'ls'; entries: LsEntry[]; footer: { text: string; href: string } | null }
  | { kind: 'file'; file: FileContent }
  | { kind: 'neofetch'; art: string[]; rows: [string, string][] }
  | { kind: 'help'; rows: [string, string][]; footer: string }
  | { kind: 'completions'; items: string[] };

export type Effect =
  | { kind: 'navigate'; href: string }
  | { kind: 'clear' }
  | { kind: 'theme'; mode: 'dark' | 'light' }
  | { kind: 'exit' };

export interface RunResult {
  blocks: Block[];
  cwd?: string[];
  effect?: Effect;
}

export interface Context {
  data: TerminalData;
  root: VfsDir;
  cwd: string[];
  theme: 'dark' | 'light';
  history: string[];
}

/** One line per visible command in `help`, in this order. */
const HELP_ROWS: [string, string][] = [
  ['ls [-a] [dir]', 'list what lives here'],
  ['cd <dir>', 'move around'],
  ['cat <file>', 'read a file'],
  ['open <path>', 'open it for real, on the site'],
  ['pwd', 'where am I?'],
  ['neofetch', 'about this machine (me)'],
  ['theme [dark|light]', 'flip the lights'],
  ['clear', 'wipe the screen'],
  ['help', 'this list'],
];

const HELP_FOOTER = 'tab completes · ↑↓ history · ctrl+c cancels · ctrl+l clears';

/** Commands offered by tab completion — eggs stay discoverable, not advertised. */
export const COMPLETABLE_COMMANDS = [
  'cat',
  'cd',
  'clear',
  'echo',
  'exit',
  'help',
  'history',
  'ls',
  'neofetch',
  'open',
  'pwd',
  'theme',
  'whoami',
];

function lines(...items: (string | TextLine)[]): Block {
  return {
    kind: 'lines',
    lines: items.map((item) => (typeof item === 'string' ? { text: item } : item)),
  };
}

function error(text: string): Block {
  return { kind: 'lines', lines: [{ text, tone: 'error' }] };
}

function lsEntry(node: VfsNode): LsEntry {
  if (node.kind === 'dir') {
    return {
      name: `${node.name}/`,
      kind: 'dir',
      href: node.href,
      title: null,
      meta: `${node.children.filter((c) => c.hidden !== true).length} items`,
    };
  }
  const { content } = node;
  return {
    name: node.name,
    kind: 'file',
    href: node.href,
    title: content.kind === 'post' ? content.post.title : null,
    meta: content.kind === 'post' ? content.post.date : null,
  };
}

export function listDir(dir: VfsDir, showHidden: boolean): Block {
  const entries = visibleChildren(dir, showHidden).map(lsEntry);
  const footer =
    dir.extraTotal > 0 && dir.href !== null
      ? { text: `+ ${dir.extraTotal} more in the archive`, href: dir.href }
      : null;
  return { kind: 'ls', entries, footer };
}

function ls(ctx: Context, args: string[]): RunResult {
  let showHidden = false;
  const paths: string[] = [];
  for (const arg of args) {
    if (arg.startsWith('-')) {
      for (const flag of arg.slice(1)) {
        if (flag === 'a') {
          showHidden = true;
        } else if (flag !== 'l') {
          return { blocks: [error(`ls: invalid option -- '${flag}'`)] };
        }
      }
    } else {
      paths.push(arg);
    }
  }
  if (paths.length > 1) {
    return { blocks: [error('ls: one directory at a time, please')] };
  }

  const target = paths[0] ?? '.';
  const node = getNode(ctx.root, resolvePath(ctx.cwd, target));
  if (!node) {
    return { blocks: [error(`ls: cannot access '${target}': No such file or directory`)] };
  }
  if (node.kind === 'file') {
    return { blocks: [{ kind: 'ls', entries: [lsEntry(node)], footer: null }] };
  }
  return { blocks: [listDir(node, showHidden)] };
}

function cd(ctx: Context, args: string[]): RunResult {
  const target = args[0] ?? '~';
  const path = resolvePath(ctx.cwd, target);
  const node = getNode(ctx.root, path);
  if (!node) {
    return { blocks: [error(`cd: no such file or directory: ${target}`)] };
  }
  if (node.kind !== 'dir') {
    return { blocks: [error(`cd: not a directory: ${target}`)] };
  }
  return { blocks: [], cwd: path };
}

function cat(ctx: Context, args: string[]): RunResult {
  const target = args[0];
  if (!target) {
    return {
      blocks: [error('cat: missing operand'), lines({ text: 'usage: cat <file>', tone: 'dim' })],
    };
  }
  const node = getNode(ctx.root, resolvePath(ctx.cwd, target));
  if (!node) {
    return { blocks: [error(`cat: ${target}: No such file or directory`)] };
  }
  if (node.kind === 'dir') {
    return { blocks: [error(`cat: ${target}: Is a directory`)] };
  }
  return { blocks: [{ kind: 'file', file: node.content }] };
}

function open(ctx: Context, args: string[]): RunResult {
  const target = args[0];
  if (!target) {
    return {
      blocks: [error('open: missing operand'), lines({ text: 'usage: open <path>', tone: 'dim' })],
    };
  }
  const node = getNode(ctx.root, resolvePath(ctx.cwd, target));
  if (!node) {
    return { blocks: [error(`open: ${target}: No such file or directory`)] };
  }
  if (node.href === null) {
    return {
      blocks: [
        error(`open: ${target}: nothing to open`),
        lines({ text: 'try cat instead — it all lives right here', tone: 'dim' }),
      ],
    };
  }
  return {
    blocks: [lines({ text: `opening ${node.href} …`, tone: 'dim' })],
    effect: { kind: 'navigate', href: node.href },
  };
}

function theme(ctx: Context, args: string[]): RunResult {
  const arg = args[0];
  if (arg !== undefined && arg !== 'dark' && arg !== 'light') {
    return { blocks: [error(`theme: expected 'dark' or 'light', got '${arg}'`)] };
  }
  const mode = arg ?? (ctx.theme === 'dark' ? 'light' : 'dark');
  return {
    blocks: [lines({ text: `theme → ${mode}`, tone: 'ok' })],
    effect: { kind: 'theme', mode },
  };
}

const NEOFETCH_ART = [
  '███╗   ███╗██████╗ ',
  '████╗ ████║██╔══██╗',
  '██╔████╔██║██████╔╝',
  '██║╚██╔╝██║██╔══██╗',
  '██║ ╚═╝ ██║██████╔╝',
  '╚═╝     ╚═╝╚═════╝ ',
];

/**
 * Pure function of the data, shared by the boot transcript and the typed
 * command — the pre-run card and a later `neofetch` must print the same thing.
 */
export function neofetchBlock(data: TerminalData): Block {
  const rows: [string, string][] = [['user', `guest@${data.host}`]];
  if (data.role !== null) {
    rows.push(['role', data.role]);
  }
  rows.push(['based', data.location]);
  if (data.uptime !== null) {
    rows.push(['uptime', data.uptime]);
  }
  if (data.topSkills.length > 0) {
    rows.push(['stack', data.topSkills.join(' · ')]);
  }
  rows.push(['posts', `${data.articleTotal} articles · ${data.projectTotal} projects`]);
  rows.push(['shell', 'zsh (emulated, obviously)']);
  return { kind: 'neofetch', art: NEOFETCH_ART, rows };
}

function history(ctx: Context): RunResult {
  if (ctx.history.length === 0) {
    return { blocks: [lines({ text: 'history: nothing yet', tone: 'dim' })] };
  }
  return {
    blocks: [
      {
        kind: 'lines',
        lines: ctx.history.map((entry, i) => ({
          text: `${String(i + 1).padStart(4)}  ${entry}`,
        })),
      },
    ],
  };
}

const READ_ONLY_COMMANDS = ['rm', 'mv', 'cp', 'touch', 'mkdir', 'chmod', 'chown'];
const EDITOR_COMMANDS = ['vim', 'vi', 'nvim', 'nano', 'emacs'];

export function run(ctx: Context, rawInput: string): RunResult {
  const input = rawInput.trim();
  if (input === '') {
    return { blocks: [] };
  }
  const [command = '', ...args] = input.split(/\s+/);

  switch (command) {
    case 'help':
      return { blocks: [{ kind: 'help', rows: HELP_ROWS, footer: HELP_FOOTER }] };
    case 'ls':
      return ls(ctx, args);
    case 'cd':
      return cd(ctx, args);
    case 'pwd':
      return { blocks: [lines(`/home/guest${ctx.cwd.map((s) => `/${s}`).join('')}`)] };
    case 'cat':
      return cat(ctx, args);
    case 'open':
      return open(ctx, args);
    case 'clear':
      return { blocks: [], effect: { kind: 'clear' } };
    case 'echo':
      return { blocks: [lines(input.slice(5))] };
    case 'whoami':
      return { blocks: [lines('guest', { text: '(make yourself at home)', tone: 'dim' })] };
    case 'history':
      return history(ctx);
    case 'theme':
      return theme(ctx, args);
    case 'neofetch':
    case 'fastfetch':
    case 'fetch':
      return { blocks: [neofetchBlock(ctx.data)] };
    case 'sudo':
      return {
        blocks: [error('guest is not in the sudoers file. This incident will be reported.')],
      };
    case 'exit':
    case 'logout':
      return {
        blocks: [
          lines('logout', {
            text: `Connection to ${ctx.data.host} closed. (the header up top still works)`,
            tone: 'dim',
          }),
        ],
        effect: { kind: 'exit' },
      };
    default:
      if (READ_ONLY_COMMANDS.includes(command)) {
        return { blocks: [error(`${command}: read-only file system (the blog stays)`)] };
      }
      if (EDITOR_COMMANDS.includes(command)) {
        return {
          blocks: [
            lines(
              { text: `${command}: no editors on this box`, tone: 'error' },
              { text: 'the writing happens in a cozy admin panel far away', tone: 'dim' },
            ),
          ],
        };
      }
      return {
        blocks: [
          error(`zsh: command not found: ${command}`),
          lines({ text: "type 'help' to see what this shell can do", tone: 'dim' }),
        ],
      };
  }
}

export interface Completion {
  /** Full replacement input when the completion is unambiguous. */
  value: string | null;
  /** Candidates to print when there is more than one. */
  options: string[];
}

function longestCommonPrefix(items: string[]): string {
  let prefix = items[0];
  for (const item of items.slice(1)) {
    while (!item.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
}

/**
 * Tab completion for the live input line: command names for the first word,
 * paths afterwards. `cd` only completes directories, because completing a file
 * it will refuse to enter is just rude.
 */
export function complete(ctx: Pick<Context, 'root' | 'cwd'>, input: string): Completion {
  const beforeCursor = input;
  const tokens = beforeCursor.split(/\s+/);
  const partial = tokens[tokens.length - 1];
  const isCommand = tokens.length === 1;

  let candidates: { insert: string; display: string }[];
  if (isCommand) {
    candidates = COMPLETABLE_COMMANDS.filter((c) => c.startsWith(partial)).map((c) => ({
      insert: `${c} `,
      display: c,
    }));
  } else {
    const slash = partial.lastIndexOf('/');
    const dirPart = slash === -1 ? '' : partial.slice(0, slash + 1);
    const basePart = slash === -1 ? partial : partial.slice(slash + 1);
    const dirNode = getNode(ctx.root, resolvePath(ctx.cwd, dirPart === '' ? '.' : dirPart));
    if (!dirNode || dirNode.kind !== 'dir') {
      return { value: null, options: [] };
    }
    const command = tokens[0];
    candidates = visibleChildren(dirNode, basePart.startsWith('.'))
      .filter((node) => node.name.startsWith(basePart))
      .filter((node) => command !== 'cd' || node.kind === 'dir')
      .map((node) => ({
        insert: dirPart + node.name + (node.kind === 'dir' ? '/' : ' '),
        display: node.kind === 'dir' ? `${node.name}/` : node.name,
      }));
  }

  if (candidates.length === 0) {
    return { value: null, options: [] };
  }
  const head = beforeCursor.slice(0, beforeCursor.length - partial.length);
  if (candidates.length === 1) {
    return { value: head + candidates[0].insert, options: [] };
  }
  const common = longestCommonPrefix(candidates.map((c) => c.insert));
  const value = common.length > partial.length ? head + common : null;
  return { value, options: candidates.map((c) => c.display) };
}

/** The window-bar title, e.g. `guest@mikhailbahdashych.me: ~/articles`. */
export function windowTitle(host: string, cwd: string[]): string {
  return `guest@${host}: ${formatCwd(cwd)}`;
}
