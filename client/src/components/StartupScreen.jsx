import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Check, RefreshCw, WifiOff } from 'lucide-react';
import { Brand, Button } from './ui';

export default function StartupScreen({ phase = 'session', error = false, onRetry, onLogout }) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        setElapsed(0);
        if (error) return;
        const start = Date.now();
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
        return () => clearInterval(timer);
    }, [phase, error]);
    const profile = phase === 'profile';
    const title = error ? 'Let’s try that connection again.' : !profile ? 'Finding your momentum.' : elapsed < 8 ? 'Connecting your fitness space.' : elapsed < 45 ? 'Waking up your fitness space.' : 'Still getting things ready.';
    return <main className="startup-page">
        <header><Brand /><span className="startup-header-note">YOUR PERSONAL FITNESS SPACE</span></header>
        <section className="startup-card">
            <div className={`startup-emblem ${error ? 'has-error' : ''}`} aria-hidden="true">
                {error ? <WifiOff size={30} /> : <Activity size={32} strokeWidth={1.8} />}
                {!error && <span />}
            </div>
            <p className="eyebrow">{error ? 'A MOMENT TO RECONNECT' : 'A LITTLE BETTER, EVERY DAY'}</p>
            <div role={error ? 'alert' : 'status'}>
                <h1>{title}</h1>
                <p className="startup-description">{error ? profile ? 'Your fitness service couldn’t connect. It may still be starting, or your connection may have dropped. Please try again.' : 'Your sign-in session couldn’t be restored. Check your connection and try again.' : profile ? 'The fitness service may be waking up after a little rest. This can take about a minute. We’ll open your space automatically when it’s ready.' : phase === 'page' ? 'Getting your next page ready.' : 'Restoring your secure session and getting your next small win ready.'}</p>
            </div>
            {!error && <>
                <div className="startup-progress" aria-hidden="true"><span /></div>
                {profile && <ol className="startup-stages" aria-label="Connection stages">
                    <li className="is-complete"><Check size={15} aria-hidden="true" /><span>Secure sign-in confirmed</span></li>
                    <li className="is-current"><span className="startup-stage-dot" /><span>Connecting to your fitness service</span></li>
                    <li><span className="startup-stage-dot" /><span>Opening your personal space</span></li>
                </ol>}
                <p className="startup-time" aria-live="off">{elapsed > 0 ? `${elapsed}s elapsed · ` : ''}{elapsed >= 60 && profile ? 'Still connecting. No need to refresh.' : 'You’ll continue automatically.'}</p>
            </>}
            {error && <div className="startup-actions"><Button onClick={onRetry}><RefreshCw size={17} /> Try again</Button>{onLogout && <Button variant="secondary" onClick={onLogout}>Sign out</Button>}</div>}
            <Link className="startup-explore" to="/how-it-works">{error ? 'Explore how AI Guruji works' : 'Explore the project while you wait'}<ArrowUpRight size={16} /></Link>
        </section>
        <footer>GOOD FOOD. BETTER MOVEMENT. YOUR OWN PACE.</footer>
    </main>;
}
