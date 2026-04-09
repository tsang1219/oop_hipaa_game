import { useState, useEffect, useCallback } from 'react';

interface TitleScreenProps {
  hasSave: boolean;
  onNewGame: () => void;
  onResume: () => void;
}

function PixelComputerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} width="384" height="385" viewBox="0 0 384 385" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 300.081H66V282.081H84V30.0813H48V228.081H66V264.081H48V282.081H30V300.081H12V354.081H48V300.081Z" fill="#2D5A68"/>
      <path d="M84 264.081V282.081H66V300.081H48V354.081H84V300.081H102V282.081H120V264.081H84Z" fill="#5CB0CA"/>
      <path d="M318 264.081H300V282.081H318V264.081Z" fill="#5CB0CA"/>
      <path d="M336 282.081H318V300.081H336V282.081Z" fill="#5CB0CA"/>
      <path d="M336 300.081V336.081H318V354.081H354V300.081H336Z" fill="#5CB0CA"/>
      <path d="M318 300.081V282.081H300V264.081H120V282.081H102V300.081H84V354.081H318V336.081H336V300.081H318Z" fill="#6DD8F9"/>
      <path d="M282 66.0813H264V84.0813H282V66.0813Z" fill="#B3B3B3"/>
      <path d="M282 174.081H264V192.081H282V174.081Z" fill="#B3B3B3"/>
      <path d="M138 48.0813V30.0813H84V246.081H138V228.081H120V48.0813H138Z" fill="#5CB0CA"/>
      <path d="M300 228.081H282V246.081H300V228.081Z" fill="#5CB0CA"/>
      <path d="M282 30.0813V48.0813H300V228.081H318V30.0813H282Z" fill="#5CB0CA"/>
      <path d="M282 30.0813H138V48.0813H282V30.0813Z" fill="#6DD8F9"/>
      <path d="M300 48.0813H282V66.0813H300V48.0813Z" fill="#6DD8F9"/>
      <path d="M282 192.081V210.081H120V228.081H138V246.081H282V228.081H300V192.081H282Z" fill="#6DD8F9"/>
      <path d="M120 66.0813H84V192.081H120V66.0813Z" fill="#999999"/>
      <path d="M282 192.081H102V210.081H282V192.081Z" fill="#999999"/>
      <path d="M156 84.0813V66.0813H138H120V192.081H138H156V174.081H138V84.0813H156Z" fill="#B3B3B3"/>
      <path d="M264 84.0813V66.0813H156V84.0813H138V174.081H156V192.081H264V174.081H282V84.0813H264Z" fill="#E6E6E6"/>
      <path d="M66 264.081H48V282.081H66V264.081Z" fill="black"/>
      <path d="M318 264.081V228.081H300V246.081H84V228.081H66V264.081H318Z" fill="black"/>
      <path d="M318 12.0813H66V30.0813H318V12.0813Z" fill="black"/>
      <path d="M282 48.0813H102V66.0813H282V48.0813Z" fill="black"/>
      <path d="M66 30.0813H48V228.081H66V30.0813Z" fill="black"/>
      <path d="M336 30.0813H318V228.081H336V30.0813Z" fill="black"/>
      <path d="M282 210.081H102V228.081H282V210.081Z" fill="black"/>
      <path d="M300 66.0813H282V210.081H300V66.0813Z" fill="black"/>
      <path d="M48 282.081H30V300.081H48V282.081Z" fill="black"/>
      <path d="M30 300.081H12V354.081H30V300.081Z" fill="black"/>
      <path d="M336 264.081H318V282.081H336V264.081Z" fill="black"/>
      <path d="M354 282.081H336V300.081H354V282.081Z" fill="black"/>
      <path d="M372 300.081H354V354.081H372V300.081Z" fill="black"/>
      <path d="M354 354.081H30V372.081H354V354.081Z" fill="black"/>
      <path d="M102 282.081H84V300.081H102V282.081Z" fill="black"/>
      <path d="M138 282.081H120V300.081H138V282.081Z" fill="black"/>
      <path d="M174 282.081H156V300.081H174V282.081Z" fill="black"/>
      <path d="M120 318.081H102V336.081H120V318.081Z" fill="black"/>
      <path d="M84 318.081H66V336.081H84V318.081Z" fill="black"/>
      <path d="M192 318.081H174V336.081H192V318.081Z" fill="black"/>
      <path d="M156 318.081H138V336.081H156V318.081Z" fill="black"/>
      <path d="M210 282.081H192V300.081H210V282.081Z" fill="black"/>
      <path d="M246 282.081H228V300.081H246V282.081Z" fill="black"/>
      <path d="M282 282.081H264V300.081H282V282.081Z" fill="black"/>
      <path d="M228 318.081H210V336.081H228V318.081Z" fill="black"/>
      <path d="M300 318.081H282V336.081H300V318.081Z" fill="black"/>
      <path d="M264 318.081H246V336.081H264V318.081Z" fill="black"/>
      <path d="M102 66.0813H84V210.081H102V66.0813Z" fill="black"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M211.75 129.797C215.41 132.708 216.187 135.749 216.198 138.95L216.194 139.246C216.114 141.892 214.923 146.568 208.327 150.203L207.755 150.511C206.449 151.198 205.292 151.681 203.244 152.36C208.253 154.693 211.152 158.377 211.152 162.582C211.152 168.669 205.661 172.148 199.455 174.215C202.526 176.242 204.144 178.887 204.144 181.613C204.144 183.327 203.919 185.123 201.096 187.199L200.805 187.408C200.619 187.539 200.393 187.623 200.141 187.623C199.557 187.623 199.083 187.186 199.083 186.648C199.083 186.515 199.114 186.388 199.168 186.273L199.229 186.161C201.524 182.602 199.036 180.332 194.989 178.718L194.745 178.622V184.258C194.745 186.114 193.111 187.619 191.099 187.619C189.156 187.619 187.566 186.216 187.458 184.449L187.453 184.258V178.618C183.179 180.272 180.94 182.177 182.843 185.925L182.964 186.157C183.052 186.302 183.107 186.466 183.107 186.645C183.107 187.182 182.633 187.619 182.049 187.619C181.848 187.619 181.661 187.566 181.501 187.475L181.386 187.401C178.181 185.334 177.969 183.25 177.969 181.569C177.969 178.743 179.509 176.323 182.375 174.396L182.687 174.192L183.145 173.908C184.299 173.214 185.309 172.785 188.128 171.632L193.32 169.51C193.802 169.314 194.263 169.128 194.705 168.949C201.724 166.115 203.849 165.256 203.849 162.575C203.849 161.298 201.873 159.389 198.103 158.206L194.737 157.177V161.463L187.446 164.461V157.174L184.069 158.206C180.299 159.385 178.323 161.298 178.323 162.575C178.323 164.32 179.213 165.338 182.097 166.683C179.592 167.816 177.448 169.23 175.731 170.861C173 168.857 171.035 166.121 171.035 162.575C171.035 157.597 175.097 153.349 181.922 151.211L198.744 146.107C202.437 144.963 203.355 144.58 204.804 143.783C206.901 142.627 208.275 141.255 208.727 139.907C207.426 139.659 206.066 139.114 204.782 138.26C201.093 135.8 199.459 131.76 201.129 129.232C202.948 126.479 207.929 126.671 211.75 129.797ZM181.051 129.232C182.724 131.76 181.087 135.8 177.397 138.26C176.114 139.114 174.754 139.659 173.452 139.907C173.904 141.255 175.279 142.627 177.375 143.783C178.009 144.131 178.542 144.401 179.249 144.689L179.618 144.835L179.577 144.848C176.518 145.806 173.824 147.131 171.563 148.741C166.776 145.238 165.992 141.205 165.992 138.946C165.992 135.749 166.772 132.708 170.429 129.797C174.254 126.668 179.231 126.483 181.051 129.232ZM191.095 85.5396C202.186 85.5396 211.177 93.8494 211.177 104.1C211.177 113.161 204.153 120.706 194.862 122.335L194.86 141.156L187.33 143.244L187.331 122.335C178.039 120.707 171.013 113.162 171.013 104.1C171.013 93.8494 180.004 85.5396 191.095 85.5396ZM139.37 90.1814C140.877 90.1905 141.883 90.248 142.906 90.4178C144.883 90.7461 146.677 91.6376 147.942 93.0401C149.152 94.3805 149.938 95.9664 150.72 98.4004L151.172 99.8907C151.293 100.31 151.423 100.774 151.569 101.303L152.396 104.339L153.388 107.864L154.025 109.976C154.6 111.81 155.017 112.916 155.287 113.386L155.35 113.487C155.295 113.484 155.297 113.498 155.318 113.517L155.42 113.579C155.4 113.557 155.379 113.53 155.358 113.498L155.35 113.487L155.718 113.534C156.053 113.567 156.522 113.588 157.215 113.599L158.929 113.61L166.634 113.554C167.493 115.228 168.45 116.718 169.507 118.021C170.563 119.324 171.736 120.465 173.028 121.443L158.954 121.5L157.459 121.499C155.951 121.49 154.945 121.433 153.922 121.263C151.945 120.934 150.152 120.043 148.886 118.64C147.787 117.422 147.037 116 146.322 113.923L146.108 113.28C145.855 112.492 145.599 111.611 145.259 110.378L143.932 105.534L143.287 103.296C142.444 100.446 141.863 98.8356 141.526 98.267L141.478 98.1936C141.533 98.1964 141.531 98.1818 141.511 98.1634L141.409 98.1014L141.461 98.1672L141.478 98.1936L141.11 98.1466C140.775 98.1132 140.307 98.0926 139.613 98.0815L137.9 98.0708L130.176 98.1271C128.638 98.1572 127.203 97.4164 126.421 96.1915C125.642 94.9713 125.629 93.4577 126.388 92.2264C127.149 90.9904 128.571 90.2289 130.076 90.2366L137.853 90.1803L139.37 90.1814ZM244.318 90.1797L252.081 90.2365C253.619 90.2286 255.041 90.9902 255.802 92.2262C256.561 93.4574 256.548 94.9711 255.769 96.1912C254.987 97.4162 253.552 98.1571 252.047 98.1274L244.297 98.0708L242.579 98.0814C241.884 98.0926 241.414 98.1132 241.08 98.1466L240.711 98.1909L240.728 98.1699L240.782 98.1008L240.697 98.1502C240.664 98.173 240.647 98.1948 240.703 98.1938L240.711 98.1909L240.668 98.263C240.27 98.9281 239.535 101.044 238.428 104.934L236.534 111.79L236.082 113.28C235.3 115.714 234.514 117.3 233.304 118.641C232.039 120.043 230.245 120.934 228.268 121.263C227.245 121.432 226.239 121.49 224.717 121.499L223.215 121.5L209.213 121.443C210.467 120.49 211.624 119.349 212.684 118.021C213.743 116.692 214.683 115.203 215.505 113.553L223.255 113.61L224.973 113.599C225.668 113.588 226.138 113.567 226.472 113.534L226.839 113.487L226.824 113.511L226.77 113.58L226.856 113.53C226.889 113.507 226.906 113.485 226.849 113.486L226.839 113.487L226.884 113.418C227.282 112.752 228.018 110.637 229.124 106.747L231.019 99.8909L231.47 98.4006C232.252 95.9665 233.039 94.3805 234.249 93.0399C235.514 91.6375 237.307 90.746 239.285 90.4176C240.209 90.2644 241.133 90.1993 242.368 90.1838L244.318 90.1797ZM200.629 94.7196C199.79 94.7401 199.083 95.3035 198.938 96.0672C197.587 102.608 193.986 107.667 186.191 111.047C185.607 111.287 185.209 111.8 185.15 112.389C185.092 112.977 185.382 113.549 185.909 113.883C186.436 114.218 187.118 114.263 187.691 114.001C196.375 110.235 200.892 104.015 202.406 96.6791C202.514 96.1913 202.375 95.6845 202.03 95.3028C201.683 94.9211 201.168 94.7063 200.629 94.7196ZM181.711 94.7677C181.12 94.7962 180.584 95.0964 180.283 95.5673C179.982 96.0382 179.957 96.617 180.215 97.1091C181.041 98.7426 181.507 100.479 181.976 102.332C182.11 102.908 182.571 103.373 183.18 103.547C183.79 103.721 184.454 103.578 184.917 103.172C185.38 102.766 185.57 102.161 185.413 101.589C184.94 99.7166 184.426 97.7316 183.413 95.7279C183.141 95.168 182.551 94.7969 181.887 94.7677C181.829 94.7649 181.77 94.7649 181.711 94.7677ZM189.943 93.3191C189.383 93.3341 188.864 93.594 188.544 94.0195C188.225 94.445 188.142 94.9854 188.323 95.4758C188.925 97.1907 189.158 98.9671 189.376 100.859C189.438 101.443 189.834 101.951 190.413 102.19C190.992 102.429 191.666 102.363 192.178 102.016C192.689 101.669 192.96 101.095 192.887 100.512C192.666 98.6002 192.42 96.572 191.681 94.4684C191.447 93.7681 190.736 93.298 189.943 93.3191Z" fill="black"/>
    </svg>
  );
}

export function TitleScreen({ hasSave, onNewGame, onResume }: TitleScreenProps) {
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = hasSave
    ? [{ label: 'RESUME', action: onResume }, { label: 'NEW GAME', action: onNewGame }]
    : [{ label: 'NEW GAME', action: onNewGame }];

  // Staggered reveal
  useEffect(() => {
    setTimeout(() => setShowLogo(true), 200);
    setTimeout(() => setShowTitle(true), 600);
    setTimeout(() => setShowSubtitle(true), 1100);
    setTimeout(() => setShowMenu(true), 1600);
    setTimeout(() => setShowFooter(true), 2100);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showMenu) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % menuItems.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuItems[selectedIndex].action();
      }
    },
    [showMenu, menuItems, selectedIndex],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Twinkling stars — positioned deterministically via seed
  const stars = Array.from({ length: 30 }, (_, i) => ({
    left: `${((i * 37 + 13) % 97)}%`,
    top: `${((i * 53 + 7) % 85)}%`,
    delay: `${(i * 0.4) % 3}s`,
    size: i % 3 === 0 ? 3 : 2,
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] relative overflow-hidden font-['Press_Start_2P']">
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Twinkling stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animation: `star-twinkle ${2 + (i % 3)}s ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}

      {/* Pixel computer logo */}
      <div
        className="z-20 mb-4"
        style={{
          opacity: showLogo ? 1 : 0,
          transform: showLogo ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
          transition: 'all 700ms ease-out',
        }}
      >
        <PixelComputerLogo className="w-24 h-24 drop-shadow-[0_0_12px_rgba(93,176,202,0.4)]" />
      </div>

      {/* Title */}
      <div
        className="text-center mb-1 z-20"
        style={{
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
          transition: 'all 800ms ease-out',
        }}
      >
        <h1
          className="text-[20px] font-bold tracking-wider leading-relaxed"
          style={{ animation: showTitle ? 'title-glow 3s ease-in-out infinite' : 'none' }}
        >
          HIPAApocalypse
        </h1>
      </div>

      {/* Subtitle */}
      <div
        className="text-center mb-10 z-20"
        style={{
          opacity: showSubtitle ? 1 : 0,
          transform: showSubtitle ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 600ms ease-out',
        }}
      >
        <p className="text-[8px] tracking-[0.3em] text-[#00d4aa]">
          HIPAA TRAINING
        </p>
      </div>

      {/* Menu card */}
      <div
        className="z-20"
        style={{
          opacity: showMenu ? 1 : 0,
          transform: showMenu ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 500ms ease-out',
        }}
      >
        <div className="bg-[#16213e] border-4 border-[#FF6B9D] rounded-[4px] px-10 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-center gap-3 w-full text-left text-[12px] transition-colors duration-150 ${
                  selectedIndex === i ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span
                  className="inline-block w-4 text-[#FF6B9D]"
                  style={{
                    animation: selectedIndex === i ? 'cursor-blink 800ms step-end infinite' : 'none',
                    opacity: selectedIndex === i ? 1 : 0,
                  }}
                >
                  {'>'}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div
        className="absolute bottom-8 z-20"
        style={{
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        <p className="text-[7px] text-gray-600 tracking-wide">
          ARROW KEYS TO SELECT &bull; ENTER TO CONFIRM
        </p>
      </div>

      {/* Pixel hospital silhouette */}
      <div className="absolute bottom-0 left-0 right-0 z-0 flex items-end justify-center gap-0 pointer-events-none opacity-[0.08]">
        <div className="w-8 h-12 bg-white" />
        <div className="w-6 h-20 bg-white" />
        <div className="w-10 h-28 bg-white" />
        <div className="w-4 h-36 bg-white" />
        <div className="w-12 h-44 bg-white" />
        <div className="w-6 h-32 bg-white" />
        <div className="w-8 h-24 bg-white" />
        <div className="w-14 h-48 bg-white" />
        <div className="w-6 h-36 bg-white" />
        <div className="w-10 h-28 bg-white" />
        <div className="w-8 h-20 bg-white" />
        <div className="w-6 h-16 bg-white" />
      </div>
    </div>
  );
}
