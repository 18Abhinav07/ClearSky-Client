const LogoBar = () => {
  const logos = [
    "Stripe",
    "Notion",
    "Slack",
    "Vercel",
    "Linear",
  ];

  return (
    <section className="py-12 border-t border-border/50">
      <div className="container-main">
        <p className="text-center text-muted-foreground text-sm mb-8">
          Backed by leading e-commerce investors and founders
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-slate-light font-semibold text-lg tracking-wide opacity-60 hover:opacity-100 transition-opacity"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoBar;
