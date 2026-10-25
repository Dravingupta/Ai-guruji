import React from 'react';
import { ArrowRight, ArrowUpRight, Check, Dumbbell, Flame, Leaf, MessageCircle, MoveUpRight, Utensils, Moon, Sun } from 'lucide-react';
import { Brand, Button, IconButton, Tag } from './ui';
import { useTheme } from '../contexts/ThemeContext';
const LandingPage = ({
  onGoogleLogin,
  onEmailLoginClick
}) => {
  const { theme, toggleTheme } = useTheme();
  return <div className="landing">
  <nav className="landing-nav page-width">
    <Brand />
    <div className="landing-links">
      <a href="/how-it-works">How it works</a>
      <a href="#features">What you get</a>
    </div>
    <div className="public-nav-actions"><IconButton label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`} onClick={toggleTheme}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</IconButton><Button variant="secondary" onClick={onEmailLoginClick}>Log in <ArrowUpRight size={16} /></Button></div>
  </nav>
  <main>
    <section className="landing-hero page-width">
      <div className="hero-copy">
        <Tag><span className="live-dot" /> YOUR NEXT CHAPTER STARTS HERE</Tag>
        <h1>LESS GUESSWORK.<br />MORE <span>YOU.</span></h1>
        <p>Eat well. Move better. Find your rhythm.<br />Your everyday fitness companion, built for the way India lives.</p>
        <div className="hero-actions">
          <Button onClick={onGoogleLogin}>Find your momentum <ArrowUpRight size={20} /></Button>
          <a className="hero-secondary" href="/how-it-works">See how it works <ArrowRight size={17} /></a>
        </div>
        <div className="hero-proof">
          <span><Check size={15} /> Real Indian food</span>
          <span><Check size={15} /> Your pace, your goals</span>
          <span><Check size={15} /> AI guidance</span>
        </div>
      </div>
      <div className="hero-photo">
        <img src="/images/athlete.png" alt="Athlete holding a kettlebell in a training studio" fetchPriority="high" />
        <div className="hero-photo-shade" />
        <span className="photo-index">01 / FIND YOUR STRONG</span>
        <div className="floating-performance">
          <span className="performance-icon"><Flame size={23} /></span>
          <div>
            <small>THE BEST PLAN?</small>
            <strong>The one you come back to.</strong>
          </div>
        </div>
        <div className="photo-sticker">MADE FOR<br /><strong>YOUR EVERYDAY.</strong><MoveUpRight size={25} /></div>
      </div>
    </section>
    <div className="manifesto-strip"><div>REAL FOOD <span>✳</span> BETTER MOVEMENT <span>✳</span> SMALL WINS <span>✳</span> EVERY DAY <span>✳</span> REAL FOOD <span>✳</span> BETTER MOVEMENT</div></div>
    <section className="approach-section page-width" id="approach">
      <div className="approach-heading">
        <p className="eyebrow">FITNESS, WITHOUT THE FRICTION</p>
        <h2>Built around your life.<br /><span>Not the other way around.</span></h2>
      </div>
      <p>You don’t need a perfect routine. You need a starting point that makes sense for you. Bring your preferences, your schedule, and your favorite foods. We’ll help with the next step.</p>
    </section>
    <section className="feature-grid page-width" id="features">
      <article className="feature-card feature-food">
        <div className="feature-number">01 / EAT WITH INTENTION</div>
        <h3>Good food.<br />Familiar flavors.</h3>
        <p>Daily meal ideas with Indian staples, recipes, and simple meal swaps.</p>
        <img src="/images/food.png" alt="Vegetarian Indian meal with dal, rice, roti, and vegetables" loading="lazy" />
        <span className="feature-icon"><Utensils size={23} /></span>
      </article>
      <article className="feature-card feature-training">
        <div className="feature-number">02 / MOVE YOUR WAY</div>
        <h3>A little stronger.<br />One day at a time.</h3>
        <p>Weekly workouts for home or the gym, with clear steps and room for your own activity.</p>
        <div className="training-graphic" aria-hidden="true">
          <Dumbbell strokeWidth={1} />
          <span>SHOW UP<br /><b>FOR YOU.</b></span>
        </div>
        <span className="feature-icon"><Dumbbell size={23} /></span>
      </article>
      <article className="feature-card feature-guidance">
        <div className="feature-number">03 / ASK. LEARN. KEEP GOING.</div>
        <h3>A question?<br />You have a coach.</h3>
        <p>Helpful answers about nutrition, exercise, and the small things along the way.</p>
        <div className="sample-chat">
          <span>Can I keep eating roti?</span>
          <div>
            <Leaf size={19} />
            <p>Absolutely. Your favorite foods can be part of a balanced routine.</p>
          </div>
          <small>Illustrative conversation</small>
        </div>
        <span className="feature-icon"><MessageCircle size={23} /></span>
      </article>
    </section>
    <section className="landing-cta page-width">
      <p className="eyebrow">YOUR STARTING LINE</p>
      <h2>YOUR PACE.<br /><span>YOUR PROGRESS.</span></h2>
      <Button onClick={onEmailLoginClick}>Let’s get started <ArrowUpRight size={20} /></Button>
    </section>
  </main>
  <footer className="landing-footer page-width">
    <Brand />
    <a href="/how-it-works">How it works <ArrowUpRight size={15} /></a>
    <small>© {new Date().getFullYear()} AI Guruji</small>
  </footer>
</div>;
};
export default LandingPage;
