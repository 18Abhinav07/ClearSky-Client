const Awards = () => {
  const awards = [
    { year: "2023", title: "SaaS Awards", subtitle: "Best Automation Tool" },
    { year: "2023", title: "AI Unicorn", subtitle: "Rising Star" },
    { year: "2023", title: "Product Hunt", subtitle: "Top 5 Product" },
    { year: "2023", title: "G2 Leader", subtitle: "High Performer" },
  ];

  return (
    <section className="section-spacing bg-section-bg">
      <div className="container-main">
        <div className="text-center mb-16">
          <h2 className="text-section-title text-foreground mb-4">
            Unique awards, unique moments
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Recognized by industry leaders for innovation and excellence
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {awards.map((award, index) => (
            <div key={index} className="text-center">
              {/* Laurel Wreath */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full text-foreground">
                  {/* Left laurel */}
                  <path
                    d="M30 50 Q20 30 30 10 Q35 30 30 50 Q25 70 30 90 Q20 70 30 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  {/* Right laurel */}
                  <path
                    d="M70 50 Q80 30 70 10 Q65 30 70 50 Q75 70 70 90 Q80 70 70 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  {/* Year in center */}
                  <text
                    x="50"
                    y="55"
                    textAnchor="middle"
                    className="text-sm font-semibold fill-current"
                  >
                    {award.year}
                  </text>
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{award.title}</h3>
              <p className="text-sm text-muted-foreground">{award.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Awards;
