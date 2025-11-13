export function HowItWorks() {
  return (
    <section id="how-it-works" className="container py-20 md:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Get started in just a few simple steps.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">1</div>
          <h3 className="mt-4 text-xl font-semibold">Create an Account</h3>
          <p className="mt-2 text-muted-foreground">
            Sign up for free in less than 30 seconds.
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">2</div>
          <h3 className="mt-4 text-xl font-semibold">Fund Your Wallet</h3>
          <p className="mt-2 text-muted-foreground">
            Easily add money to your secure Nexus wallet via bank transfer or
            card.
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">3</div>
          <h3 className="mt-4 text-xl font-semibold">Pay & Go</h3>
          <p className="mt-2 text-muted-foreground">
            Select your service, and get instant value. Your data is delivered
            or bill is paid automatically.
          </p>
        </div>
      </div>
    </section>
  );
}
