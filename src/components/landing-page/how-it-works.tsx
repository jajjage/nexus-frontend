import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container py-20 md:py-32">
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Get started in just a few simple steps.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <Card className="group hover:border-primary/20 text-center transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
          <CardHeader>
            <div className="text-primary text-4xl font-bold transition-transform duration-200 ease-out group-hover:scale-110">
              1
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription className="mt-2">
              Sign up for free in less than 30 seconds.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="group hover:border-primary/20 text-center transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
          <CardHeader>
            <div className="text-primary text-4xl font-bold transition-transform duration-200 ease-out group-hover:scale-110">
              2
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle>Fund Your Wallet</CardTitle>
            <CardDescription className="mt-2">
              Easily add money to your secure Nexus wallet via bank transfer or
              card.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="group hover:border-primary/20 text-center transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
          <CardHeader>
            <div className="text-primary text-4xl font-bold transition-transform duration-200 ease-out group-hover:scale-110">
              3
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle>Pay & Go</CardTitle>
            <CardDescription className="mt-2">
              Select your service, and get instant value. Your data is delivered
              or bill is paid automatically.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
