import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-background -z-10" />
      
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight tracking-tight text-slate-dark max-w-xl">
              Automate your startup workflows and scale delivery
            </h1>
            <p className="text-body text-muted-foreground max-w-md">
              Streamline and manage your department's service delivery end-to-end, and enable digital transformation in a matter of days, not years.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg">
                Book a demo
              </Button>
              <Button variant="heroOutline" size="lg" onClick={onGetStarted}>
                Get started
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              
              {/* Glow effect */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-electric-blue/20 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
