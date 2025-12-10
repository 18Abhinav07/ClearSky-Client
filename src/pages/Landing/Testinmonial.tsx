import { Button } from "@/components/ui/button";
import Cloud from "@/components/ui/Cloud";

const Testimonials = () => {
  return (
    <section className="section-spacing bg-background relative overflow-hidden">
      <Cloud
        className="animate-float"
        style={{
          width: '400px',
          top: '5%',
          right: '-15%',
          opacity: 0.1,
          animationDuration: '40s',
        }}
      />
      <div className="container-main">
        <div className="bg-card rounded-4xl overflow-hidden shadow-soft">
          <div className="grid lg:grid-cols-[1fr,0.4fr]">
            {/* Left - Quote */}
            <div className="p-10 lg:p-16 flex flex-col justify-center">
              <blockquote className="text-2xl lg:text-3xl font-semibold text-foreground leading-relaxed mb-8">
                "Scaling our DePIN infrastructure from a prototype to a city-wide grid was seamless. ClearSky handled the identity and wallet complexity, allowing us to focus entirely on hardware deployment."
              </blockquote>
             
            </div>

            {/* Right - Stats */}
            <div className="bg-section-bg p-10 lg:p-16 flex flex-col justify-center items-center lg:items-start">
              <div className="text-center lg:text-left mb-8">
                <p className="text-5xl lg:text-6xl font-bold text-foreground mb-2">1000+</p>
                <p className="text-muted-foreground">Sensors Targeted </p>
              </div>

             
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
