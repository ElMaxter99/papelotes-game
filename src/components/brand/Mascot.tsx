export type Pose = 'hola' | 'dibujando' | 'gano' | 'idea' | 'esperando' | 'dormido';

const INK = '#1B2440';
const Body = ({ tall = false }: { tall?: boolean }) => (
  <>
    <rect x="22" y={tall ? 14 : 10} width="76" height={tall ? 92 : 96} rx="10" fill="#fff" stroke={INK} strokeWidth="3" />
    <path d={`M76 ${tall ? 14 : 10}v20a6 6 0 0 0 6 6h16`} fill="#FFD23F" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
  </>
);
const Legs = () => <path d="M42 106v14M78 106v14" stroke={INK} strokeWidth="4" strokeLinecap="round" />;
const Eyes = ({ y = 58 }: { y?: number }) => <g className="m-blink"><circle cx="48" cy={y} r="5" fill={INK} /><circle cx="72" cy={y} r="5" fill={INK} /></g>;

export const POSES: Record<Pose, { label: string; anim: string }> = {
  hola: { label: 'Papelo saluda', anim: 'm-bob' },
  dibujando: { label: 'Papelo dibuja', anim: 'm-sway' },
  gano: { label: 'Papelo celebra', anim: 'm-hop' },
  idea: { label: 'Papelo tiene una idea', anim: 'm-bob' },
  esperando: { label: 'Papelo espera', anim: 'm-sway' },
  dormido: { label: 'Papelo duerme', anim: '' },
};

/** Mascota «Papelo». Las animaciones son CSS (globals.css) y se desactivan con prefers-reduced-motion. */
export function Mascot({ pose, size = 160, decorative = false }: { pose: Pose; size?: number; decorative?: boolean }) {
  const { label, anim } = POSES[pose];
  return (
    <svg className={`m ${anim}`} width={size} height={(size * 130) / 120} viewBox="0 0 120 130" role={decorative ? 'presentation' : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
      {pose === 'hola' && <><Body /><Eyes /><path d="M50 74q10 9 20 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /><g className="m-wave"><path d="M98 70l16-16" stroke={INK} strokeWidth="4" strokeLinecap="round" /></g><path d="M22 76l-14 10" stroke={INK} strokeWidth="4" strokeLinecap="round" /><Legs /></>}
      {pose === 'dibujando' && <><Body /><Eyes y={56} /><path d="M54 74h12" stroke={INK} strokeWidth="3" strokeLinecap="round" /><g className="m-draw"><path d="M98 80l-16 10" stroke={INK} strokeWidth="4" strokeLinecap="round" /><rect x="70" y="86" width="22" height="7" rx="3" transform="rotate(-30 81 90)" fill="#2F5BEA" stroke={INK} strokeWidth="2.5" /></g><path d="M30 100c8-8 14 4 22-2" fill="none" stroke="#2F5BEA" strokeWidth="3" strokeLinecap="round" /><Legs /></>}
      {pose === 'gano' && <><Body tall /><path d="M42 56q6-8 12 0M66 56q6-8 12 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /><path d="M48 70q12 14 24 0z" fill="#E83E8C" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M22 70l-14-20M98 70l14-20" stroke={INK} strokeWidth="4" strokeLinecap="round" /><Legs /></>}
      {pose === 'idea' && <><Body tall /><circle cx="48" cy="58" r="6" fill="#fff" stroke={INK} strokeWidth="3" /><circle cx="72" cy="58" r="6" fill="#fff" stroke={INK} strokeWidth="3" /><circle cx="50" cy="56" r="2.5" fill={INK} /><circle cx="74" cy="56" r="2.5" fill={INK} /><ellipse cx="60" cy="76" rx="5" ry="6" fill={INK} /><g className="m-pop"><circle cx="92" cy="12" r="9" fill="#FFD23F" stroke={INK} strokeWidth="3" /><path d="M92-4v-5M104 2l4-3M80 2l-4-3" stroke={INK} strokeWidth="3" strokeLinecap="round" /></g><Legs /></>}
      {pose === 'esperando' && <><Body /><Eyes /><path d="M52 76h16" stroke={INK} strokeWidth="3" strokeLinecap="round" /><path d="M22 76l12 10M98 76l-12 10" stroke={INK} strokeWidth="4" strokeLinecap="round" /><Legs /></>}
      {pose === 'dormido' && <><g transform="rotate(8 60 110)"><Body tall /><path d="M40 58q8 6 16 0M64 58q8 6 16 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /><path d="M54 76q6 4 12 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /><Legs /></g><g className="m-zzz" fill="#2F5BEA" fontWeight="800"><text x="92" y="30" fontSize="16">z</text><text x="102" y="18" fontSize="12">z</text></g></>}
    </svg>
  );
}
