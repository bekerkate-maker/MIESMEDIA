import React from 'react';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';
import logoDeBeren from '@/components/logo_klanten/de_beren__logo.png';
import logoHeineken from '@/components/logo_klanten/heineken_logo.png';

const ClientLogoBanner: React.FC = React.memo(() => {
  return (
    <div className="logo-banner-wrapper">
      <div className="logo-banner">
        <div className="logo-banner-inner">
          <div className="logo-scroll">
            {[...Array(12)].map((_, setIndex) => (
              <div key={`logo-set-${setIndex}`} style={{ display: 'flex', gap: 60, alignItems: 'center', flexShrink: 0, paddingRight: 60 }}>
                <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
                <img src={logoKoekela} alt="Koekela" className="logo-small" />
                <img src={logoDeBeren} alt="De Beren" className="logo-large logo-beren" />
                <img src={logoJordys} alt="Jordys" className="logo-normal logo-jordys" />
                <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal logo-morgan" />
                <img src={logoDudok} alt="Dudok" className="logo-xlarge logo-dudok" />
                <img src={logoHeineken} alt="Heineken" className="logo-xxlarge" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .logo-banner-wrapper {
          width: 100%;
          position: relative;
          z-index: 20;
        }
        .logo-banner {
          background: #f8f7f2;
          padding: 12px 0;
          overflow: hidden;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          min-height: 60px;
        }
        .logo-banner-inner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .logo-scroll {
          display: flex;
          align-items: center;
          animation: scroll 240s linear infinite;
          will-change: transform;
          white-space: nowrap;
          width: max-content;
        }
        .logo-scroll img {
          width: auto;
          object-fit: contain;
          filter: grayscale(100%) brightness(1.1); /* Slight brightness boost to force off-whites to pure white */
          flex-shrink: 0;
          mix-blend-mode: multiply;
        }
        .logo-small { height: 25px; }
        .logo-normal { height: 40px; }
        .logo-large { height: 62px; }
        .logo-xlarge { height: 60px; }
        .logo-xxlarge { 
          height: 32px; 
          transform: scale(1.5); 
          margin: 0 10px;
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
        }
        .logo-jordys { height: 52px; }
        .logo-morgan { height: 52px; }
        .logo-dudok { height: 70px; }

        @media (max-width: 600px) {
          .logo-small { height: 18px; }
          .logo-normal { height: 28px; }
          .logo-large { height: 36px; }
          .logo-xlarge { height: 32px; }
          .logo-xxlarge { height: 10px; max-width: 48px; transform: scale(1); }
          .logo-jordys { height: 32px; }
          .logo-morgan { height: 32px; }
          .logo-dudok { height: 36px; }
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .logo-banner { min-height: 55px; } 
          .logo-small { height: 24px; } 
          .logo-normal { height: 36px; }
          .logo-large { height: 44px; }
          .logo-xlarge { height: 50px; }
          .logo-xxlarge { 
            height: 42px; 
            transform: scale(2.0);
            filter: grayscale(100%) brightness(1.2) contrast(1.1) !important;
          }
        }
      `}</style>
    </div>
  );
});

export default ClientLogoBanner;
