import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Brand, Button, Field, GoogleIcon } from './ui';
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const authenticate = async action => {
    setError('');
    setLoading(true);
    try {
      await action();
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'That email or password doesn’t look right. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
        'auth/popup-closed-by-user': 'The Google sign-in window was closed. You can try again.',
        'auth/weak-password': 'Choose a password with at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.'
      };
      setError(messages[err.code] || 'We couldn’t sign you in. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  return <main className="auth-layout">
  <section className="auth-visual">
    <Brand />
    <img src="/images/athlete.png" alt="Athlete ready for a kettlebell workout" />
    <div className="auth-visual-copy">
      <p className="eyebrow">A LITTLE BETTER, EVERY DAY.</p>
      <h2>YOUR NEXT<br /><span>LEVEL STARTS</span><br />WITH YOU.</h2>
      <p>Good food. Better movement. Guidance when you need it.</p>
    </div>
    <span className="auth-visual-bottom">BUILT FOR YOUR EVERYDAY. / AI GURUJI</span>
  </section>
  <section className="auth-form-side">
    <a className="back-link" href="/"><ArrowLeft size={16} /> Back to home</a>
    <div className="auth-form-wrap">
      <div className="mobile-brand"><Brand /></div>
      <p className="eyebrow">YOUR SPACE TO GROW</p>
      <h1>{isLogin ? 'Welcome back.' : 'Make a fresh start.'}</h1>
      <p className="muted">{isLogin ? 'Your next small win is waiting for you.' : 'A routine that fits your life starts here.'}</p>
      <Button variant="secondary" className="full-width google-button" disabled={loading} onClick={() => authenticate(() => signInWithPopup(auth, new GoogleAuthProvider()))}><GoogleIcon /> Continue with Google</Button>
      <div className="form-divider"><span />or continue with email<span /></div>
      <form onSubmit={event => {
          event.preventDefault();
          authenticate(() => isLogin ? signInWithEmailAndPassword(auth, email, password) : createUserWithEmailAndPassword(auth, email, password));
        }} className="form-stack">
        {error && <div className="error-banner" role="alert">{error}</div>}
        <Field label="Email address"><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></Field>
        <Field label="Password"><span className="password-input">
            <input type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={isLogin ? undefined : 6} value={password} onChange={event => setPassword(event.target.value)} placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'} required />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span></Field>
        <Button className="full-width" disabled={loading} type="submit">{loading ? <><Loader2 size={18} className="spin" /> Connecting…</> : <>
            {isLogin ? 'Let’s get back to it' : 'Create my account'}
            <ArrowRight size={18} />
          </>}</Button>
      </form>
      <p className="auth-switch">{isLogin ? 'New around here?' : 'Already have an account?'} <button disabled={loading} onClick={() => {
            setIsLogin(value => !value);
            setError('');
          }}>{isLogin ? 'Create an account' : 'Log in'}</button></p>
      <div className="auth-trust">
        <ShieldCheck size={16} />
        <span>Secure sign-in. Your journey stays yours.</span>
      </div>
    </div>
    <small className="auth-footer">CONSISTENCY STARTS WITH ONE SMALL STEP.</small>
  </section>
</main>;
};
export default Auth;
