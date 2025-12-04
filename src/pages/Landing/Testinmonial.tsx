import { Button } from "@/components/ui/button";

const Testimonials = () => {
  return (
    <section className="section-spacing bg-background">
      <div className="container-main">
        <div className="bg-card rounded-4xl overflow-hidden shadow-soft">
          <div className="grid lg:grid-cols-[1fr,0.4fr]">
            {/* Left - Quote */}
            <div className="p-10 lg:p-16 flex flex-col justify-center">
              <blockquote className="text-2xl lg:text-3xl font-semibold text-foreground leading-relaxed mb-8">
                "We went from 3 to 28 people and Shielder helped us maintain the same level of efficiency. The automation saved us countless hours every week."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-electric-blue/20 flex items-center justify-center">
                  <span className="text-electric-blue font-semibold">SM</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sarah Mitchell</p>
                  <p className="text-sm text-muted-foreground">CEO, TechFlow Inc.</p>
                </div>
              </div>
            </div>

            {/* Right - Stats */}
            <div className="bg-section-bg p-10 lg:p-16 flex flex-col justify-center items-center lg:items-start">
              <div className="text-center lg:text-left mb-8">
                <p className="text-5xl lg:text-6xl font-bold text-foreground mb-2">1005+</p>
                <p className="text-muted-foreground">documents automated</p>
              </div>
              <Button variant="hero" size="lg">
                Book a demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
