import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pricingData = {
  mtn: [
    { plan: "75 MB", validity: "1 Days", price: "₦75" },
    { plan: "110MB", validity: "1 Days", price: "₦110" },
    { plan: "500 MB", validity: "30 Days", price: "340" },
    { plan: "1 GB", validity: "30 Days", price: "₦450" },
    { plan: "2 GB", validity: "30 Days", price: "₦950" },
    { plan: "3 GB", validity: "30 Days", price: "1,300" },
    { plan: "5 GB", validity: "30 Days", price: "₦1,600" },
  ],
  // glo: [
  //   { plan: "1 GB", validity: "30 Days", price: "₦1,000" },
  //   { plan: "3.6 GB", validity: "30 Days", price: "₦1,500" },
  //   { plan: "7.5 GB", validity: "30 Days", price: "₦2,500" },
  //   { plan: "12.5 GB", validity: "30 Days", price: "₦3,500" },
  //   { plan: "25 GB", validity: "30 Days", price: "₦5,000" },
  // ],
  // airtel: [
  //   { plan: "1.5 GB", validity: "30 Days", price: "₦1,000" },
  //   { plan: "3 GB", validity: "30 Days", price: "₦1,500" },
  //   { plan: "6 GB", validity: "30 Days", price: "₦2,500" },
  //   { plan: "11 GB", validity: "30 Days", price: "₦3,500" },
  //   { plan: "22 GB", validity: "30 Days", price: "₦5,000" },
  // ],
};

function PricingTable({
  plans,
}: {
  plans: { plan: string; validity: string; price: string }[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Validity</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.plan}>
            <TableCell>{plan.plan}</TableCell>
            <TableCell>{plan.validity}</TableCell>
            <TableCell className="text-right">{plan.price}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="container py-20 md:py-32">
      <div className="text-center">
        <h2 className="text-3xl font-bold md:text-4xl">
          Our Most Popular Data Plans
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Competitive pricing for all your data needs.
        </p>
      </div>
      <Tabs defaultValue="mtn" className="mt-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mtn">MTN</TabsTrigger>
          <TabsTrigger value="glo">Glo</TabsTrigger>
          <TabsTrigger value="airtel">Airtel</TabsTrigger>
        </TabsList>
        <TabsContent value="mtn">
          <PricingTable plans={pricingData.mtn} />
        </TabsContent>
        {/* <TabsContent value="glo">
          <PricingTable plans={pricingData.glo} />
        </TabsContent>
        <TabsContent value="airtel">
          <PricingTable plans={pricingData.airtel} />
        </TabsContent> */}
      </Tabs>
      <div className="mt-8 text-center">
        <Button>See All Plans & Prices</Button>
      </div>
    </section>
  );
}
