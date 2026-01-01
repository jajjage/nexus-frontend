import { redirect } from "next/navigation";

interface ReferralPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params;

  // Redirect to register page with the referral code
  redirect(`/register?ref=${code}`);
}
