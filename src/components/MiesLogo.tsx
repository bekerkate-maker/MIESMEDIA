export default function MiesLogo({ size = 60 }: { size?: number }) {
  return (
    <img 
      src="/logo_mies_media.png" 
      alt="MIES Media Logo" 
      style={{ 
        height: size,
        width: 'auto',
        display: 'block'
      }} 
    />
  );
}
