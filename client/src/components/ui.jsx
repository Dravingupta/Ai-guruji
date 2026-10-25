import React, { useEffect, useRef } from 'react';
import { Activity, ArrowUpRight, X } from 'lucide-react';
export const Brand = ({
  compact = false
}) => <a className="brand" href="/" aria-label="AI Guruji home">
  <span className="brand-mark"><Activity size={23} strokeWidth={2.6} /></span>
  {!compact && <span>AI GURUJI<span className="brand-dot">.</span></span>}
</a>;
export const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>;
export const IconButton = ({
  label,
  children,
  className = '',
  ...props
}) => <button type="button" aria-label={label} title={label} className={`icon-btn ${className}`} {...props}>{children}</button>;
export const Field = ({
  label,
  hint,
  children
}) => <label className="field">
  <span className="field-label">{label}</span>
  {children}
  {hint && <span className="field-hint">{hint}</span>}
</label>;
export const Choice = ({
  selected,
  children,
  ...props
}) => <button type="button" className={`choice ${selected ? 'is-selected' : ''}`} aria-pressed={selected} {...props}>{children}</button>;
export const Tag = ({
  children,
  className = ''
}) => <span className={`tag ${className}`}>{children}</span>;
export const SectionHeading = ({
  eyebrow,
  title,
  action
}) => <div className="section-heading">
  <div>
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h2>{title}</h2>
  </div>
  {action}
</div>;
export const Modal = ({
  title,
  eyebrow,
  children,
  onClose,
  wide = false
}) => {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    const previous = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('input, textarea, select')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return <dialog ref={ref} className={`app-modal ${wide ? 'modal-wide' : ''}`} onCancel={event => {
    event.preventDefault();
    onClose();
  }} onClick={event => {
    if (event.target === ref.current) onClose();
  }} aria-labelledby="modal-title"><div className="modal-inner">
    <header className="modal-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id="modal-title">{title}</h2>
      </div>
      <IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton>
    </header>
    {children}
  </div></dialog>;
};
export const GoogleIcon = () => <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
  <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.1Z" />
  <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2a12.3 12.3 0 0 1-18.3-6.4H5.6v5.4A20.4 20.4 0 0 0 24 44Z" />
  <path fill="#FBBC05" d="M12.5 27.5a12 12 0 0 1 0-7V15H5.6a20.2 20.2 0 0 0 0 18l6.9-5.5Z" />
  <path fill="#EA4335" d="M24 11.8c3 0 5.8 1 8 3.2l6-5.9A20 20 0 0 0 5.6 15l6.9 5.5A12.1 12.1 0 0 1 24 11.8Z" />
</svg>;
export const CoachMark = () => <span className="coach-mark">
  <Activity size={21} />
  <span />
</span>;
export const TextLink = ({
  children,
  ...props
}) => <button type="button" className="text-link" {...props}>
  {children}
  <ArrowUpRight size={16} />
</button>;
