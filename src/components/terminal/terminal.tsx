'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import { complete, run, windowTitle } from './commands';
import type { Effect } from './commands';
import { renderBlock } from './render';
import { initialEntries } from './transcript';
import type { Entry } from './transcript';
import { TerminalData, buildVfs, formatCwd } from './vfs';

/**
 * A little shell between the hero and the featured sections. The boot
 * transcript (motd + neofetch) is server-rendered from props; after hydration
 * the prompt is a live zsh-flavoured toy over the same data, scrolling inside
 * its own window. All command logic lives in ./commands — this component only
 * owns input state, focus, history and effects.
 */

/** Short hostname for the prompt; the FQDN stays in the window title. */
const PROMPT_HOST = 'blog';

function Prompt({ cwd }: { cwd: string }) {
  return (
    <span className="term-prompt">
      <span className="term-p-user">guest@{PROMPT_HOST}</span>{' '}
      <span className="term-p-path">{cwd}</span> <span className="term-p-sym">$</span>{' '}
    </span>
  );
}

function currentTheme(): 'dark' | 'light' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function Terminal({ data }: { data: TerminalData }) {
  const router = useRouter();
  const root = useMemo(() => buildVfs(data), [data]);
  const boot = useMemo(() => initialEntries(data), [data]);

  const [entries, setEntries] = useState<Entry[]>(boot);
  const [cwd, setCwd] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const hist = useRef<{ list: string[]; index: number | null; draft: string }>({
    list: [],
    index: null,
    draft: '',
  });

  /**
   * The input is uncontrolled — the DOM owns the value, the mirror follows it
   * through state. Anything that can write an input (typing, IME suggestions,
   * password managers, test drivers) then stays in sync by construction; a
   * controlled input desyncs the moment a value arrives without an onChange.
   */
  const setLine = (value: string) => {
    const el = inputRef.current;
    if (el) {
      el.value = value;
      el.setSelectionRange(value.length, value.length);
    }
    setInput(value);
    setCaret(value.length);
  };

  const append = (entry: Omit<Entry, 'id'>) => {
    seq.current += 1;
    const id = `live-${seq.current}`;
    setEntries((prev) => [...prev, { id, ...entry }]);
  };

  const applyEffect = (effect: Effect) => {
    switch (effect.kind) {
      case 'clear':
        setEntries([]);
        break;
      case 'navigate':
        router.push(effect.href);
        break;
      case 'theme':
        // Same contract as the header toggle: attribute drives CSS, storage
        // makes it stick across visits.
        document.documentElement.setAttribute('data-theme', effect.mode);
        localStorage.setItem('theme', effect.mode);
        break;
      case 'exit':
        inputRef.current?.blur();
        break;
    }
  };

  const runLine = (raw: string) => {
    const prompt = { cwd: formatCwd(cwd), text: raw };
    const trimmed = raw.trim();
    if (trimmed !== '' && trimmed !== hist.current.list[hist.current.list.length - 1]) {
      hist.current.list.push(trimmed);
    }
    hist.current.index = null;

    const result = run({ data, root, cwd, theme: currentTheme(), history: hist.current.list }, raw);
    if (result.effect?.kind === 'clear') {
      setEntries([]);
    } else {
      append({ prompt, blocks: result.blocks });
      if (result.effect) {
        applyEffect(result.effect);
      }
    }
    if (result.cwd) {
      setCwd(result.cwd);
    }
    setLine('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const h = hist.current;
    // The DOM value, not React state: at keydown time it is the one truth.
    const line = event.currentTarget.value;
    if (event.key === 'Enter') {
      runLine(line);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const completion = complete({ root, cwd }, line);
      if (completion.value !== null) {
        setLine(completion.value);
      }
      if (completion.options.length > 1) {
        append({ blocks: [{ kind: 'completions', items: completion.options }] });
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (h.list.length === 0) {
        return;
      }
      if (h.index === null) {
        h.draft = line;
        h.index = h.list.length - 1;
      } else if (h.index > 0) {
        h.index -= 1;
      }
      setLine(h.list[h.index]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (h.index === null) {
        return;
      }
      h.index += 1;
      if (h.index >= h.list.length) {
        h.index = null;
        setLine(h.draft);
      } else {
        setLine(h.list[h.index]);
      }
    } else if (event.key === 'c' && event.ctrlKey) {
      event.preventDefault();
      append({ prompt: { cwd: formatCwd(cwd), text: `${line}^C` }, blocks: [] });
      hist.current.index = null;
      setLine('');
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      setEntries([]);
    }
  };

  const syncFromInput = (
    event: ChangeEvent<HTMLInputElement> | SyntheticEvent<HTMLInputElement>,
  ) => {
    const el = event.currentTarget;
    setInput(el.value);
    setCaret(el.selectionStart ?? el.value.length);
  };

  // Clicking anywhere in the window focuses the prompt — unless the click is
  // a link doing its job, or the visitor is selecting text to copy.
  const onSurfaceClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a')) {
      return;
    }
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }
    inputRef.current?.focus({ preventScroll: true });
  };

  // The terminal scrolls internally; keep the prompt pinned to the bottom as
  // output grows. Scoped to the window's own scrollbox so running a command
  // never moves the page — and skipped until first interaction, so the boot
  // content is read from the top.
  useEffect(() => {
    const body = bodyRef.current;
    if (!interacted || !body) {
      return;
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    body.scrollTo({ top: body.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [entries, interacted]);

  return (
    // --i 2: the reveal stagger slot after the hero title (0) and intro (1).
    <section
      className="term reveal"
      style={{ '--i': 2 } as CSSProperties}
      aria-label="Interactive terminal"
      onClick={onSurfaceClick}
    >
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="term-bar-title">{windowTitle(data.host, cwd)}</span>
      </div>
      <div className="term-body" ref={bodyRef}>
        <div role="log" aria-live="polite">
          {entries.map((entry) => (
            <div key={entry.id} className="term-entry">
              {entry.prompt && (
                <p className="term-echo">
                  <Prompt cwd={entry.prompt.cwd} />
                  {entry.prompt.text}
                </p>
              )}
              {entry.blocks.map((block, i) => renderBlock(block, i))}
            </div>
          ))}
        </div>
        <div className={`term-live${focused ? ' focused' : ''}`}>
          <Prompt cwd={formatCwd(cwd)} />
          <span className="term-mirror">
            {input.slice(0, caret)}
            <span className="term-cursor">{input[caret] ?? ' '}</span>
            {input.slice(caret + 1)}
            {!interacted && input === '' && (
              <span className="term-placeholder">try &apos;help&apos;</span>
            )}
          </span>
          <input
            ref={inputRef}
            className="term-input"
            defaultValue=""
            onChange={syncFromInput}
            onSelect={syncFromInput}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
              setInteracted(true);
            }}
            onBlur={() => setFocused(false)}
            aria-label="Terminal input — type 'help' for available commands"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
        </div>
      </div>
    </section>
  );
}
