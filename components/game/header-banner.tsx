interface HeaderBannerProps {
  size?: "default" | "lg"
}

export function HeaderBanner({ size = "default" }: HeaderBannerProps) {
  const sizeClass = size === "lg" ? "text-4xl sm:text-5xl md:text-6xl" : "text-[26px] sm:text-4xl md:text-5xl"
  const paddingClass = size === "lg" ? "pt-10 pb-4" : "pt-8 pb-2"

  return (
    <header className={`px-4 text-center ${paddingClass}`}>
      <h1
        className={`${sizeClass} tracking-tight leading-none whitespace-nowrap`}
        style={{
          fontFamily: '"Saira Stencil", var(--font-saira-stencil), sans-serif',
          fontOpticalSizing: "auto",
          fontWeight: 700,
          fontVariationSettings: '"wdth" 100',
        }}
      >
        <span className="text-foreground">AI WEREW</span>
        {/* 1em box that clips the logo's transparent padding; image scaled to fill the letter slot */}
        <span
          className="relative inline-block h-[0.8em] w-[0.76em] align-[-0.05em] overflow-hidden"
          role="img"
          aria-label="O"
        >
          <img
            src="/logos/wolf-yinyang.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-[1.55]"
          />
        </span>
        <span className="text-foreground">LF </span>
        <span className="text-accent">ARENA</span>
      </h1>
    </header>
  )
}
