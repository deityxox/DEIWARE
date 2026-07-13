import { useEffect, useState, useRef } from 'react';
import { Terminal, Circle } from 'lucide-react';

interface TerminalSplashScreenProps {
  onComplete: () => void;
}

interface LogLine {
  text: string;
  color: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command' | 'system';
}

export function TerminalSplashScreen({ onComplete }: TerminalSplashScreenProps) {
  const [typedCommand, setTypedCommand] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [step, setStep] = useState<'typing' | 'running' | 'progress' | 'logs' | 'completing'>('typing');
  const [progress, setProgress] = useState(0);
  const [activeLogs, setActiveLogs] = useState<LogLine[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const commandToType = 'npm run dev';

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // 1. Typing command animation
  useEffect(() => {
    if (step !== 'typing') return;

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < commandToType.length) {
        const nextChar = commandToType.charAt(charIndex);
        setTypedCommand((prev) => prev + nextChar);
        charIndex++;
      } else {
        clearInterval(typingInterval);
        // Press Enter after typing is finished
        setTimeout(() => {
          setStep('running');
        }, 500);
      }
    }, 120);

    return () => clearInterval(typingInterval);
  }, [step]);

  // 2. Running command & showing initial scripts outputs
  useEffect(() => {
    if (step !== 'running') return;

    const timeout = setTimeout(() => {
      setStep('progress');
    }, 800);

    return () => clearTimeout(timeout);
  }, [step]);

  // 3. Loading bar progress animation
  useEffect(() => {
    if (step !== 'progress') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStep('logs');
          }, 300);
          return 100;
        }
        // Random incremental steps
        const increment = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [step]);

  // 4. Fake logs rendering sequence
  useEffect(() => {
    if (step !== 'logs') return;

    const isDark = document.documentElement.classList.contains('dark');
    const fakeLogs: { text: string; color: string; type: LogLine['type'] }[] = [
      { text: '  [SYSTEM] Checking OS build compatibility... Windows 11 detected.', color: 'text-muted-foreground/80', type: 'system' },
      { text: `  [SYSTEM] Fetching active system theme... ${isDark ? 'Dark' : 'Light'} Mode active.`, color: 'text-muted-foreground/80', type: 'system' },
      { text: '  [POLICY] Initializing ExecutionPolicy override bypass handler...', color: 'text-sky-600 dark:text-sky-400', type: 'info' },
      { text: '  [POLICY] Remote signed check: Status Unrestricted.', color: 'text-emerald-600 dark:text-emerald-400', type: 'success' },
      { text: '  [NETWORK] Checking connection to GitHub API...', color: 'text-sky-600 dark:text-sky-400', type: 'info' },
      { text: '  [NETWORK] Rate limit status: 5000/5000 queries remaining.', color: 'text-emerald-600 dark:text-emerald-400', type: 'success' },
      { text: '  [SCRIPTS] Resolving core scripts repository...', color: 'text-sky-600 dark:text-sky-400', type: 'info' },
      { text: '  [SCRIPTS] Scanning repository: deityxox/DEIWARE/tree/main/scripts', color: 'text-muted-foreground/80', type: 'system' },
      { text: '  [SCRIPTS] Successfully parsed 32 files into 9 categories.', color: 'text-emerald-600 dark:text-emerald-400', type: 'success' },
      { text: '  [INTERFACE] Loading glassmorphism token styles...', color: 'text-sky-600 dark:text-sky-400', type: 'info' },
      { text: '  [INTERFACE] Compiling Tailwind layout components...', color: 'text-sky-600 dark:text-sky-400', type: 'info' },
      { text: '  [ENGINE] DEIWARE Script Manager engine successfully running!', color: 'text-primary font-semibold', type: 'success' },
      { text: '  🚀 App launching...', color: 'text-emerald-600 dark:text-emerald-400 font-bold', type: 'success' }
    ];

    let currentLogIndex = 0;
    const printLog = () => {
      if (currentLogIndex < fakeLogs.length) {
        const logItem = fakeLogs[currentLogIndex];
        setActiveLogs((prev) => [...prev, logItem]);
        currentLogIndex++;

        // Auto scroll to bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }

        // Slightly random delays for authentic terminal look
        const delay = Math.random() * 150 + 100;
        setTimeout(printLog, delay);
      } else {
        // Complete the splash screen after log output completes
        setTimeout(() => {
          setStep('completing');
        }, 800);
      }
    };

    setTimeout(printLog, 300);
  }, [step]);

  // 5. Fade out and complete
  useEffect(() => {
    if (step !== 'completing') return;
    const timeout = setTimeout(() => {
      onComplete();
    }, 600); // match transition duration
    return () => clearTimeout(timeout);
  }, [step, onComplete]);

  // Helper for generating progress bar blocks
  const getProgressBar = () => {
    const totalBlocks = 30;
    const filledBlocks = Math.round((progress / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const bar = '■'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    return `[${bar}] ${progress}%`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-all duration-500 ease-in-out ${step === 'completing' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
    >
      {/* Terminal Container */}
      <div className="w-[90vw] max-w-4xl h-[70vh] rounded-xl border border-border glass-card shadow-2xl flex flex-col overflow-hidden font-mono text-sm leading-relaxed text-foreground">

        {/* Terminal Header */}
        <div className="h-11 border-b border-border bg-muted/40 px-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3.5 h-3.5 fill-red-500/80 stroke-none cursor-pointer" />
            <Circle className="w-3.5 h-3.5 fill-yellow-500/80 stroke-none cursor-pointer" />
            <Circle className="w-3.5 h-3.5 fill-emerald-500/80 stroke-none cursor-pointer" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium tracking-wide">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            deiwareOS - Optimizer
          </div>
          <div className="w-14" /> {/* Spacer */}
        </div>

        {/* Terminal Body */}
        <div
          ref={containerRef}
          className="flex-1 p-6 overflow-y-auto scrollbar-thin select-text"
        >
          {/* Shell Prompt */}
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="text-primary font-semibold">ozguro@deiware.deitysign.com.tr</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-sky-600 dark:text-sky-400">~/deitysign/deiware</span>
            <span className="text-muted-foreground">$</span>
            <span className="text-foreground flex items-center font-medium">
              {typedCommand}
              {step === 'typing' && showCursor && (
                <span className="inline-block w-2 h-4 bg-primary ml-0.5" />
              )}
            </span>
          </div>

          {/* Running command output */}
          {(step === 'running' || step === 'progress' || step === 'logs' || step === 'completing') && (
            <div className="mt-2 space-y-1">
              <div className="text-muted-foreground/70">&gt; deiware@1.0.0 dev</div>
              <div className="text-muted-foreground/70">&gt; concurrently &quot;npm run dev:vite&quot; &quot;npm run dev:electron&quot;</div>
            </div>
          )}

          {/* Progress Bar */}
          {(step === 'progress' || step === 'logs' || step === 'completing') && (
            <div className="mt-4 space-y-1">
              <div className="text-sky-600 dark:text-sky-400">Fetching packages &amp; mapping script components...</div>
              <div className="text-primary font-semibold tracking-wider font-mono">
                {getProgressBar()}
              </div>
            </div>
          )}

          {/* Logs */}
          {(step === 'logs' || step === 'completing') && (
            <div className="mt-4 space-y-1 border-t border-border pt-3">
              {activeLogs.map((log, idx) => (
                <div key={idx} className={log.color}>
                  {log.text}
                </div>
              ))}
              {step === 'logs' && showCursor && (
                <div className="flex items-center">
                  <span className="inline-block w-2 h-4 bg-primary" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
