import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const mtnPlans = [
  { plan: "1.5 GB", validity: "30 Days", price: "₦1,000" },
  { plan: "2.5 GB", validity: "30 Days", price: "₦1,500" },
  { plan: "5 GB", validity: "30 Days", price: "₦2,500" },
  { plan: "10 GB", validity: "30 Days", price: "₦3,500" },
  { plan: "20 GB", validity: "30 Days", price: "₦5,000" },
];

const gloPlans = [
  { plan: "1.8 GB", validity: "30 Days", price: "₦1,000" },
  { plan: "3.6 GB", validity: "30 Days", price: "₦1,500" },
  { plan: "7.5 GB", validity: "30 Days", price: "₦2,500" },
  { plan: "12.5 GB", validity: "30 Days", price: "₦3,500" },
  { plan: "25 GB", validity: "30 Days", price: "₦5,000" },
];

const airtelPlans = [
  { plan: "1.5 GB", validity: "30 Days", price: "₦1,000" },
  { plan: "3 GB", validity: "30 Days", price: "₦1,500" },
  { plan: "6 GB", validity: "30 Days", price: "₦2,500" },
  { plan: "11 GB", validity: "30 Days", price: "₦3,500" },
  { plan: "22 GB", validity: "30 Days", price: "₦5,000" },
];

export function Pricing() {
  return (
    <section id="pricing" className="container py-20 md:py-32">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Our Most Popular Data Plans
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mtnPlans.map((plan) => (
                <TableRow key={plan.plan}>
                  <TableCell>{plan.plan}</TableCell>
                  <TableCell>{plan.validity}</TableCell>
                  <TableCell className="text-right">{plan.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="glo">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gloPlans.map((plan) => (
                <TableRow key={plan.plan}>
                  <TableCell>{plan.plan}</TableCell>
                  <TableCell>{plan.validity}</TableCell>
                  <TableCell className="text-right">{plan.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="airtel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airtelPlans.map((plan) => (
                <TableRow key={plan.plan}>
                  <TableCell>{plan.plan}</TableCell>
                  <TableCell>{plan.validity}</TableCell>
                  <TableCell className="text-right">{plan.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
      <div className="mt-8 text-center">
        <Button>See All Plans & Prices</Button>
      </div>
    </section>
  );
}
