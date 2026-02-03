import React from 'react';
import logoCasu from '@/components/logo_klanten/logo_casu.png';
import logoKoekela from '@/components/logo_klanten/logo-koekela-winkels-denieuwebinnenweg.png';
import logoJordys from '@/components/logo_klanten/JORDYS_LOGO.png';
import logoMorganMees from '@/components/logo_klanten/morganmees_logo.png';
import logoDudok from '@/components/logo_klanten/dudok_logo.png';
import logoDeBeren from '@/components/logo_klanten/de_beren_logo.png';
import logoHeineken from '@/components/logo_klanten/heineken_logo.png';

const ClientLogoBanner: React.FC = () => {
  return (
    <div className="logo-banner-wrapper">
      <div className="logo-banner">
        <div className="logo-banner-inner">
          <div className="logo-scroll">
            {[...Array(12)].map((_, setIndex) => (
              <div key={`logo-set-${setIndex}`} style={{ display: 'flex', gap: 60, alignItems: 'center', flexShrink: 0, paddingRight: 60 }}>
                <img src={logoCasu} alt="La Cazuela" className="logo-normal" />
                <img src={logoKoekela} alt="Koekela" className="logo-small" />
                <img src={logoJordys} alt="Jordys" className="logo-normal" />
                <img src={logoMorganMees} alt="Morgan & Mees" className="logo-normal" />
                <img src={logoDudok} alt="Dudok" className="logo-xlarge" />
                <img src={logoDeBeren} alt="De Beren" className="logo-large" />
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
          background: #fff;
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
          filter: grayscale(100%);
          flex-shrink: 0;
        }
        .logo-small { height: 25px; }
        .logo-normal { height: 40px; }
        .logo-large { height: 50px; }
        .logo-xlarge { height: 60px; }
        .logo-xxlarge { height: 45px; transform: scale(2.2); margin: 0 15px; }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

@media (max-width: 768px) {
          .logo-banner { min-height: 55px; } /* Increased min-height */
          /* Adjusted mobile sizes to be larger */
          .logo-small { height: 24px; } 
          .logo-normal { height: 36px; }
          .logo-large { height: 44px; }
          .logo-xlarge { height: 50px; }
          .logo-xxlarge { height: 42px; transform: scale(2.0); }
        }
      `}</style>
    </div>
  );
};

export default ClientLogoBanner;
