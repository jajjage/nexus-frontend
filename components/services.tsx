import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wifi, Smartphone, Tv, Lightbulb } from "lucide-react";

const services = [
  {
    icon: <Wifi className="h-8 w-8" />,
    title: "Buy Data Sub",
    description: "Instant data for MTN, Glo, Airtel, and 9mobile at the best rates.",
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    title: "Airtime Top-up",
    description: "Top-up any network with ease and get instant value.",
  },
  {
    icon: <Tv className="h-8 w-8" />,
    title: "TV Subscription",
    description: "Pay for your DStv, GOtv, and other TV subscriptions.",
  },
  {
    icon: <Lightbulb className="h-8 w-8" />,
    title: "Electricity Bills",
    description: "Pay your KEDCO and other electricity bills conveniently.",
  },
];

export function Services() {
  return (
    <section id="services" className="container py-20 md:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          All Your Payments in One Place
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          We offer a wide range of services to meet your needs.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <Card key={service.title} className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full">
                {service.icon}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription className="mt-2">
                {service.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
