import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How do I fund my wallet?",
    answer:
      "You can easily fund your wallet via bank transfer or card payment. All transactions are secure and processed instantly.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Yes, all payments are processed through secure gateways with industry-standard encryption to protect your financial information.",
  },
  {
    question: "How long does data delivery take?",
    answer:
      "Data delivery is instant. Once your payment is confirmed, your data plan will be activated immediately.",
  },
  {
    question: "What happens if my bill payment fails?",
    answer:
      "In case of a failed bill payment, the amount will be refunded to your wallet. You can then retry the payment or contact support for assistance.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="container py-20 md:py-32">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold md:text-4xl">Got Questions?</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            We've got answers. Check out our frequently asked questions below.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
