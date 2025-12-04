import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import salesChartImage from "@/assets/feature-sales-chart.png";

const FeaturesA = () => {
  const features = [
    "Inventory management",
    "Dynamic bundles",
    "Purchase orders",
    "Team collaboration",
    "Dashboard insights",
  ];

  return (
    <section id="features" className="section-spacing bg-background">
      <div className="container-main">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image */}
          <div className="relative order-2 lg:order-1">
            <img
              src={salesChartImage}
              alt="Total sales analytics dashboard"
              className="w-full h-auto rounded-3xl"
            />
          </div>

          {/* Right - Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <h2 className="text-section-title text-foreground">
              The only features you need at the right time
            </h2>
            <p className="text-body text-muted-foreground">
              Manage, edit, and sync product information across all your sales channels—lightning fast.
            </p>
            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-foreground" />
                  </div>
                  <span className="text-feature-label text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="heroOutline" size="lg">
              Get started
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesA;
