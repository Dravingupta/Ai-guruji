import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, Check, Dumbbell, Expand, Fingerprint, Layers, MessageCircle, Moon, Scale, Sun, Utensils } from 'lucide-react';
import { Brand, IconButton, Modal, Tag } from './ui';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const screens = [
  { id: 'nutrition', number: '01', label: 'NUTRITION', title: 'Familiar food. A plan that fits.', description: 'Four daily meal slots, Indian staples, portions, macros, and recipes. Swap a meal when life changes, or log something of your own.', image: 'nutrition', alt: 'Nutrition screen showing a four-meal Indian vegetarian menu with calories, macros, recipes, and meal logging', icon: Utensils, tone: 'peach' },
  { id: 'training', number: '02', label: 'TRAINING', title: 'A clear next move.', description: 'Explore a week of training for home or the gym. Follow sets, reps, and form cues, tick off exercises, and add extra movement.', image: 'training', alt: 'Training screen with a session summary, exercise cards, sets, repetitions, and session completion', icon: Dumbbell, tone: 'lilac' },
  { id: 'progress', number: '03', label: 'PROGRESS', title: 'The bigger picture, at your pace.', description: 'Revisit saved days and follow actual weight measurements over time. Weigh daily, weekly, reuse a reference, or skip sharing a number.', image: 'progress', alt: 'Progress screen showing an illustrative measured-weight chart, activity summaries, and optional check-ins', icon: Scale, tone: 'mint' },
];

export default function HowItWorks() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const appPath = user ? '/dashboard' : '/auth';
  useEffect(() => {
    const previous = document.title;
    document.title = 'How it works · AI Guruji';
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, []);
  const preview = (screen, eager = false) => <button className={`tour-screen tour-screen-${screen.image}`} onClick={() => setExpanded(screen)} aria-label={`Enlarge ${screen.label.toLowerCase()} screenshot`}>
    <span className="tour-window-bar" aria-hidden="true"><i /><i /><i /><span>AI GURUJI / {screen.label}</span><Expand size={14} /></span>
    <img src={`/images/product/${screen.image}.webp`} alt={screen.alt} width="1280" height="720" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} />
    <span className="tour-expand"><Expand size={13} /> Explore screenshot</span>
  </button>;
  return <div className="how-page">
    <a className="tour-skip" href="#how-main">Skip to content</a>
    <header className="landing-nav page-width tour-nav">
      <Brand />
      <nav className="landing-links" aria-label="Project navigation"><a href="#product-tour">The product</a><a href="#under-the-hood">Behind the build</a></nav>
      <div className="public-nav-actions"><IconButton label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`} onClick={toggleTheme}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</IconButton><Link className="btn btn-secondary" to={appPath}>{user ? 'My space' : 'Try it out'} <ArrowUpRight size={16} /></Link></div>
    </header>
    <main id="how-main">
      <section className="tour-hero page-width">
        <div className="tour-hero-copy">
          <Tag><span className="live-dot" /> THE IDEA BEHIND AI GURUJI</Tag>
          <h1>YOUR ROUTINE.<br /><span>CONNECTED.</span></h1>
          <p className="tour-lead">A personal fitness companion for the way India eats, moves, and lives.</p>
          <p>Meal plans, workouts, everyday logging, and quick trainer-style follow-ups — brought together in one calm, personal space.</p>
          <div className="hero-actions"><a className="btn btn-primary" href="#product-tour">Take the tour <ArrowDown size={17} /></a><Link className="text-link" to={appPath}>Explore the app <ArrowUpRight size={17} /></Link></div>
          <div className="tour-hero-notes"><span><Check size={14} /> Indian food preferences</span><span><Check size={14} /> Home & gym routines</span><span><Check size={14} /> Optional weigh-ins</span></div>
        </div>
        <div className="tour-hero-preview">
          <div className="tour-preview-label"><Activity size={16} /><span>ONE SPACE. YOUR EVERYDAY.</span><span className="live-dot" /></div>
          {preview({ image: 'overview', label: 'OVERVIEW', title: 'Your day, in one place.', alt: 'AI Guruji overview in the warm light theme with today’s meal, movement, and checklist summaries' }, true)}
          <p>Actual app screens · illustrative profile & sample data</p>
        </div>
      </section>
      <section className="tour-purpose page-width" aria-labelledby="purpose-title">
        <div><p className="eyebrow">THE PROBLEM</p><h2 id="purpose-title">A plan is only the start.<br /><span>Everyday support matters.</span></h2></div>
        <div><p>Knowing what to eat or how to train is one part of the routine. Following it means making substitutions, asking small questions, and finding your way back after a busy day.</p><p>AI Guruji connects those moments: a plan shaped by your profile, a place to record what actually happened, and a focused coach for the questions in between.</p></div>
      </section>
      <section className="tour-journey page-width" aria-labelledby="journey-title">
        <div className="tour-section-heading"><div><p className="eyebrow">FROM SETUP TO SMALL WINS</p><h2 id="journey-title">A routine you can return to.</h2></div><span className="tour-section-note">Four simple steps. One connected flow.</span></div>
        <ol className="tour-steps">
          {[['01', 'Make it personal', 'Set your goal, food preferences, activity level, and training setup.'], ['02', 'Get your starting point', 'Create a daily menu and a week of workouts around your profile.'], ['03', 'Live it. Log it. Ask.', 'Record meals and movement; ask Guruji a quick question about your plan.'], ['04', 'Look back. Keep going.', 'Review saved days and optional weigh-ins, then return to today.']].map(([n, title, text]) => <li key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></li>)}
        </ol>
      </section>
      <section className="product-tour page-width" id="product-tour" aria-labelledby="tour-title">
        <div className="tour-section-heading"><div><p className="eyebrow">A CLOSER LOOK</p><h2 id="tour-title">Thoughtful details.<br />Useful every day.</h2></div><p className="tour-section-note">Real screenshots. Select any screen for a larger view.</p></div>
        {screens.map(screen => <article className={`tour-feature tone-${screen.tone}`} key={screen.id}>
          <div className="tour-feature-copy"><span className="tour-feature-icon"><screen.icon size={24} /></span><p className="eyebrow">{screen.number} / {screen.label}</p><h3>{screen.title}</h3><p>{screen.description}</p></div>
          {preview(screen)}
        </article>)}
        <article className="tour-coach-panel">
          <div><span className="tour-feature-icon"><MessageCircle size={24} /></span><p className="eyebrow">04 / ASK GURUJI</p><h3>The little questions<br />deserve a useful answer.</h3><p>Like messaging your trainer after they’ve given you a plan. Guruji helps with portions, swaps, exercise technique, and recovery, using your profile and current plan for context.</p><span className="tour-scope-note">Unrelated tasks and full programme requests receive a short redirect.</span></div>
          <div className="tour-chat-example"><span className="tour-chat-label">ILLUSTRATIVE FOLLOW-UP</span><div className="tour-chat-user">Can I replace the paneer in my lunch?</div><div className="tour-chat-answer"><span className="brand-mark"><Activity size={20} /></span><p>Tofu is an option. The portion may need adjusting to match the protein in your planned meal. Keep the roti and vegetables alongside it.</p></div><small>A focused conversation about your routine.</small></div>
        </article>
        <p className="tour-sample-note">Screens use a fictional profile and sample plans. Illustrative trends are a product walkthrough, not a claim about user outcomes.</p>
      </section>
      <section className="tour-build page-width" id="under-the-hood" aria-labelledby="build-title">
        <div className="tour-section-heading"><div><p className="eyebrow">BEHIND THE BUILD</p><h2 id="build-title">A complete experience.<br />Deliberate engineering.</h2></div><p className="tour-section-note">A full-stack project connecting identity, structured AI generation, daily tracking, and progress.</p></div>
        <div className="tour-stack"><span>React + Vite</span><ArrowRight size={15} /><span>Express API</span><ArrowRight size={15} /><span>MongoDB</span><span className="tour-stack-service">Firebase Auth</span><span className="tour-stack-service">Groq AI</span></div>
        <div className="tour-build-grid">
          <article><Fingerprint size={24} /><h3>Identity owns the data</h3><p>Firebase handles sign-in. The API verifies the ID token and uses its UID for profile and weight-journal ownership.</p></article>
          <article><Layers size={24} /><h3>AI with a defined job</h3><p>Daily diets require four distinct, validated meal slots. A separate scope check keeps coach replies focused on trainer follow-ups.</p></article>
          <article><Scale size={24} /><h3>Progress with honest signals</h3><p>Charts use actual measurements. Reused and skipped entries stay distinct, and a change in weight is never labelled as fat loss.</p></article>
        </div>
        <details className="tour-boundaries"><summary>How your data is stored <span>+</span></summary><p>Profiles, generated-plan records, and weight check-ins are stored in MongoDB. The daily working plans, completion logs, meal swaps, and coach conversation are currently kept in this browser. Activity history does not yet sync between devices; clearing browser storage can remove that working history.</p></details>
      </section>
      <section className="tour-final page-width"><div><p className="eyebrow">TAKE THE NEXT STEP</p><h2>A LITTLE BETTER.<br /><span>EVERY DAY.</span></h2><p>Start with your preferences. Build a routine that makes sense for you.</p></div><Link to={appPath} className="btn btn-primary">{user ? 'Back to my space' : 'Make it personal'} <ArrowUpRight size={20} /></Link></section>
    </main>
    <footer className="landing-footer page-width"><Brand /><Link to="/">Back to home <ArrowUpRight size={15} /></Link><small>© {new Date().getFullYear()} AI Guruji</small></footer>
    {expanded && <Modal title={expanded.title} eyebrow={`${expanded.label} / PRODUCT WALKTHROUGH`} wide onClose={() => setExpanded(null)}><p className="tour-image-hint">Swipe or scroll to inspect the full screen.</p><div className="tour-image-scroll" tabIndex={0} role="region" aria-label="Enlarged screenshot. Scroll horizontally on smaller screens."><img className="tour-modal-image" src={`/images/product/${expanded.image}.webp`} alt={expanded.alt} width="1280" height="720" /></div><p className="tour-sample-note">Actual app screen with a fictional profile and sample data.</p></Modal>}
  </div>;
}
