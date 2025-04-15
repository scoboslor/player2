import React, { useEffect, useState, memo } from 'react';
import ColorThief from 'colorthief';

interface Props {
  imageUrl: string | undefined;
  isPlaying: boolean;
}

export function DynamicBackground({ imageUrl, isPlaying }: Props) {
  const [colors, setColors] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = async () => {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 4);
      
      setIsTransitioning(true);
      const newColors = palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
      setColors(newColors);

      const dominantColor = colorThief.getColor(img);
      const bgColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;

      const textColor = getTextColor(dominantColor);

      document.documentElement.style.setProperty("--color", bgColor);
      document.documentElement.style.setProperty(
          "--text-color",
          `rgb(${textColor})`
      );

      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 1000);
    };
  }, [imageUrl]);

  if (!colors.length) return null;

  const gradientStyle = {
    position: "fixed" as const,
    inset: 0,
    background: `radial-gradient( at 40% 20%, var(--color-0) 0px, transparent 50% ),
      radial-gradient(at 80% 0%, var(--color-1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, var(--color-2) 0px, transparent 50%),
      radial-gradient(at 80% 50%, var(--color-3) 0px, transparent 50%),
      radial-gradient(at 0% 100%, var(--color-4) 0px, transparent 50%),
      radial-gradient(at 80% 100%, var(--color-5) 0px, transparent 50%),
      radial-gradient(at 0% 0%, var(--color-6) 0px, transparent 50%)`,
    opacity: isTransitioning ? 0 : 1,
    transition: "all 1s ease-in-out",
    zIndex: -2,
    // animation: 'rotate 60s linear infinite',
    scale: 1.5,
    // filter: 'blur(var(--blur)) saturate(var(--saturate))',
    // animation: 'blur 10s linear infinite alternate, saturate 10s linear infinite alternate',
  };

  return <div style={gradientStyle} />;
}

// Function to calculate brightness
function getBrightness(rgb: number[]) {
  const [r, g, b] = rgb;
  // Using the formula for perceived brightness
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Function to make a color lighter or darker
function adjustColor(rgb: number[], factor: number) {
  return rgb.map((value) => Math.min(255, Math.max(0, value + factor)));
}

export function getTextColor(dominantColor: number[]) {
  const brightness = getBrightness(dominantColor);
  return brightness > 128
          ? adjustColor(dominantColor, -100)
          : adjustColor(dominantColor, 100);
}

export const DynamicBackgroundTEST = memo(function DynamicBackgroundTEST({ imageUrl, isPlaying }: Props) {
    const [colors, setColors] = useState<string[]>([]);
  
    useEffect(() => {
      if (!imageUrl) return;
  
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
  
      img.onload = async () => {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img);

        // Apply colors to CSS using requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            palette.forEach((color: number[], i: number) => {
              document.documentElement.style.setProperty(
                `--color-${i}`,
                `rgb(${color.join(",")})`
              );
            });
          });
        
        const newColors = palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
        setColors(newColors);
  
        const dominantColor = colorThief.getColor(img);
        const bgColor = `rgb(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]})`;

        const metaTag = document.querySelector('meta[name="theme-color"]');
        if (metaTag) {
          metaTag.setAttribute("content", bgColor);
        }
        const faviconTag = document.querySelector('link[rel="icon"]');
        if (faviconTag) {
          faviconTag.setAttribute("href", imageUrl);
        }

          // Function to calculate brightness
        function getBrightness(rgb: number[]) {
              const [r, g, b] = rgb;
              // Using the formula for perceived brightness
              return 0.299 * r + 0.587 * g + 0.114 * b;
          }
  
          // Function to make a color lighter or darker
          function adjustColor(rgb: number[], factor: number) {
              return rgb.map((value) => Math.min(255, Math.max(0, value + factor)));
          }
  
          // Determine if the background is light or dark
          const brightness = getBrightness(dominantColor);
          const textColor =
              brightness > 128
                  ? adjustColor(dominantColor, -100)
                  : adjustColor(dominantColor, 100);
  
          document.documentElement.style.setProperty("--color", bgColor);
          document.documentElement.style.setProperty(
              "--text-color",
              `rgb(${textColor})`
          );
        
      };
    }, [imageUrl]);
  
    if (!colors.length) return null;
  
    const gradientStyle = {
      position: "fixed" as const,
      inset: 0,
      background: `
        radial-gradient(at 0% 0%, ${colors[0]} 0%, transparent 50%),
        radial-gradient(at 100% 0%, ${colors[1]} 0%, transparent 50%),
        radial-gradient(at 100% 100%, ${colors[2]} 0%, transparent 50%),
        radial-gradient(at 0% 100%, ${colors[3]} 0%, transparent 50%)
      `,
      transition: "all 1s ease-in-out",
      zIndex: -1,
    };
  
    return <>
            <DynamicBackground imageUrl={imageUrl} />
            <marquee data-background direction="down" behavior="alternate" data-playing={isPlaying} scrollamount={isPlaying ? 6 : 0}>
                <marquee behavior="alternate" data-index="1" scrollamount={isPlaying ? 6 : 0}></marquee>
                <marquee behavior="alternate" data-index="2" scrollamount={isPlaying ? 6 : 0}></marquee>
                <marquee behavior="alternate" data-index="3" scrollamount={isPlaying ? 6 : 0}></marquee>
                <marquee behavior="alternate" data-index="4" scrollamount={isPlaying ? 6 : 0}></marquee>
            </marquee>
        </>;
  })