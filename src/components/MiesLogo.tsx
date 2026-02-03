
import headLogo from '@/assets/Head logo.png';

// ... imports
export default function MiesLogo({ size = 40, style, className }: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '-48px 0 8px 0',
        ...style
      }}
    >
      <img
        src={headLogo}
        alt="The Unposed Collective"
        style={{
          height: size * 2,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          marginBottom: 12,
        }}
      />
    </div>
  );
}

