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
    icon: <Wifi className="text-primary h-8 w-8" />,
    title: "Buy Data Sub",
    description:
      "Instant data for MTN, Glo, Airtel, and 9mobile at the best rates.",
  },
  {
    icon: <Smartphone className="text-primary h-8 w-8" />,
    title: "Airtime Top-up",
    description: "Top-up any network with ease and get instant value.",
  },
  {
    icon: <Tv className="text-primary h-8 w-8" />,
    title: "TV Subscription",
    description: "Pay for your DStv, GOtv, and other TV subscriptions.",
  },
  {
    icon: <Lightbulb className="text-primary h-8 w-8" />,
    title: "Electricity Bills",
    description: "Pay your KEDCO and other electricity bills conveniently.",
  },
];

export function Services() {
  return (
    <section id="services" className="container py-20 md:py-32">
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-4xl">
          All Your Payments in One Place
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          We offer a wide range of services to meet your needs.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <Card
            key={service.title}
            className="text-center transition-shadow hover:shadow-lg"
          >
            <CardHeader>
              <div className="bg-primary/10 mx-auto rounded-full p-4">
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
