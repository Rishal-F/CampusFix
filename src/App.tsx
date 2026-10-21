import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutPage, AdminDashboardPage, ContactPage, DashboardPage, HowItWorksPage, MyReportsPage, ReportIssuePage } from './student/StudentPages';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4';
const SENSITIVITY = 0.8;

function useTypewriter(text: string, speed = 38, startDelay = 600, reducedMotion = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    let interval: number | undefined;
    const delay = window.setTimeout(() => {
      let index = 0;
      interval = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(delay);
      if (interval) window.clearInterval(interval);
    };
  }, [reducedMotion, speed, startDelay, text]);

  return { displayed, done };
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.2">
      <rect x="3.5" y="1.5" width="6.5" height="7" rx="1" />
      <path d="M2.5 4.5h-.25a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-.25" />
    </svg>
  );
}

export function App() {
  const [route, setRoute] = useState(window.location.hash.replace('#', '') || '/');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '/dashboard') return <DashboardPage />;
  if (route === '/report') return <ReportIssuePage />;
  if (route === '/reports' || route.startsWith('/reports/')) return <MyReportsPage />;
  if (route === '/how-it-works') return <HowItWorksPage />;
  if (route === '/about') return <AboutPage />;
  if (route === '/contact') return <ContactPage />;
  if (route === '/admin' || route.startsWith('/admin/')) return <AdminDashboardPage />;
  return <LandingPage />;
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const links = ['Report an issue', 'My reports', 'How it works', 'About CampusFix'];
  return (
    <div
      className={`fixed inset-0 z-[9] flex flex-col justify-center gap-8 bg-white/95 px-8 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      {links.map((link) => (
        <a className="text-[32px] font-medium leading-none" href={link === 'Report an issue' ? '#/report' : link === 'My reports' ? '#/reports' : link === 'How it works' ? '#/how-it-works' : '#/about'} onClick={onClose} key={link}>
          {link}
        </a>
      ))}
      <a className="text-[32px] font-medium leading-none underline underline-offset-4" href="mailto:hello@campusfix.co" onClick={onClose}>
        Get in touch
      </a>
    </div>
  );
}

function Navbar({ menuOpen, onMenuToggle }: { menuOpen: boolean; onMenuToggle: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-white/30 px-5 py-4 backdrop-blur-[2px] sm:px-8 sm:py-5">
      <a className="flex items-center gap-3 text-[21px] tracking-tight sm:text-[26px]" href="/" style={{ fontFamily: 'var(--font-heading)' }}>
        <span>CampusFix®</span>
        <span className="select-none text-[25px] tracking-[-0.02em] sm:text-[30px]" aria-hidden="true">✳︎</span>
      </a>
      <nav className="hidden items-center justify-center gap-1 text-[18px] text-black md:flex xl:text-[21px]">
        <a className="transition-opacity hover:opacity-60" href="#/report">Report an issue</a>
        <span aria-hidden="true">,</span>
        <a className="transition-opacity hover:opacity-60" href="#/reports">My reports</a>
        <span aria-hidden="true">,</span>
        <a className="transition-opacity hover:opacity-60" href="#/how-it-works">How it works</a>
        <span aria-hidden="true">,</span>
        <a className="transition-opacity hover:opacity-60" href="#/about">About us</a>
      </nav>
      <a className="hidden justify-self-end text-sm text-black underline underline-offset-2 transition-opacity hover:opacity-60 sm:text-lg md:block lg:text-[21px]" href="mailto:hello@campusfix.co">
        Get in touch
      </a>
      <button className="flex flex-col gap-[5px] md:hidden" onClick={onMenuToggle} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
        <span className={`h-[2px] w-6 bg-black transition-transform duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
        <span className={`h-[2px] w-6 bg-black transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`h-[2px] w-6 bg-black transition-transform duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
      </button>
    </header>
  );
}

function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevX = useRef<number | null>(null);
  const targetTime = useRef(0);
  const seeking = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const { displayed, done } = useTypewriter(
    'Glad you stopped in. Good systems make better campuses. Now, what are we fixing?',
    38,
    600,
    reducedMotion,
  );

  const seekVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const current = video.currentTime;
    if (Math.abs(targetTime.current - current) < 0.01) {
      seeking.current = false;
      return;
    }
    seeking.current = true;
    video.currentTime = targetTime.current;
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);
    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setActionsVisible(true), 400);
    if (reducedMotion) {
      return () => window.clearTimeout(timer);
    }
    const handleMouseMove = (event: MouseEvent) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const previous = prevX.current ?? event.clientX;
      prevX.current = event.clientX;
      const delta = event.clientX - previous;
      targetTime.current = Math.max(
        0,
        Math.min(video.duration, targetTime.current + (delta / window.innerWidth) * SENSITIVITY * video.duration),
      );
      if (!seeking.current) seekVideo();
    };
    const handleSeeked = () => {
      if (Math.abs(targetTime.current - (videoRef.current?.currentTime ?? targetTime.current)) > 0.01) seekVideo();
      else seeking.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    videoRef.current?.addEventListener('seeked', handleSeeked);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
      videoRef.current?.removeEventListener('seeked', handleSeeked);
    };
  }, [reducedMotion, seekVideo]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('hello@campusfix.co');
      setCopyFeedback('Email copied');
    } catch {
      setCopyFeedback('Copy unavailable');
    }
    window.setTimeout(() => setCopyFeedback(''), 2200);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#d9f0ff] text-black">
      {!videoUnavailable && <video ref={videoRef} onError={() => setVideoUnavailable(true)} className="fixed inset-0 z-0 h-full w-full object-cover object-[70%_center]" muted playsInline preload="auto">
        <source src={VIDEO_URL} type="video/mp4" />
      </video>}
      <div className="fixed inset-0 z-0 bg-[#d9f0ff]/55" />
      <Navbar menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <section className="relative z-[1] flex min-h-screen items-end overflow-hidden px-5 pb-12 pt-28 sm:px-8 sm:pb-16 md:items-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl">
          <p className="pointer-events-none mb-5 select-none whitespace-pre-line text-[clamp(18px,4vw,26px)] font-normal leading-[1.3] text-black blur-[1px] sm:mb-6">
            {'Hey there, meet CampusFix,\nYour campus issue-resolution companion'}
          </p>
          <h1 className="mb-4 max-w-lg text-[clamp(30px,6vw,58px)] font-medium leading-[1.05] tracking-[-0.04em] text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
            Make campus work better.
          </h1>
          <p className="mb-5 max-w-lg text-[clamp(17px,3vw,24px)] leading-[1.35] text-black/90 sm:mb-6">
            {displayed}
            {!done && <span className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-blink bg-black align-middle" />}
          </p>
          <div className={`flex flex-wrap gap-y-1 transition-[opacity,transform] duration-[400ms] ease-out ${actionsVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
            {['Report an issue', 'Track my report', 'Help my campus', 'See how it works'].map((label) => (
              <a className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.3em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[15px]" href={label === 'Report an issue' ? '#/report' : label === 'Track my report' ? '#/reports' : label === 'See how it works' ? '#/how-it-works' : '#/about'} key={label}>
                {label}
              </a>
            ))}
            <button className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.3em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:gap-3 sm:px-5 sm:text-[15px]" onClick={copyEmail}>
              <span>Reach us: <u className="underline-offset-1">hello@campusfix.co</u></span>
              <CopyIcon />
            </button>
          </div>
          {copyFeedback && <p className="mt-2 text-xs text-black/75" role="status">{copyFeedback}</p>}
        </div>
      </section>
    </main>
  );
}
