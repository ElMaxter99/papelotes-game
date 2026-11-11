/** Icono de Papelotes (hoja con la esquina doblada y un trazo de rotulador). */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="10" y="6" width="44" height="52" rx="6" fill="#fff" stroke="#1B2440" strokeWidth="3" />
      <path d="M40 6v12a4 4 0 0 0 4 4h10" fill="#FFD23F" stroke="#1B2440" strokeWidth="3" strokeLinejoin="round" />
      <path d="M18 44c6-14 10 2 14-8s8-4 14-10" fill="none" stroke="#2F5BEA" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Logo() {
  return <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><LogoMark /><span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.03em' }}>Papelotes</span></span>;
}
