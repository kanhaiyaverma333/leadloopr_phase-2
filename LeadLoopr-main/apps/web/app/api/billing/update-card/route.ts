//not in use



// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { PrismaClient } from "../../../../../../packages/database/generated/client";
// import { stripe } from "../../../../lib/stripe/stripe";

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { paymentMethodId } = await req.json();
//     if (!paymentMethodId) {
//       return NextResponse.json(
//         { error: "Missing payment method ID" },
//         { status: 400 }
//       );
//     }

//     // Fetch user with organization
//     const user = await prisma.user.findUnique({
//       where: { clerkId: userId },
//       include: { currentOrganization: true },
//     });

//     if (!user || !user.currentOrganization) {
//       return NextResponse.json(
//         { error: "User or organization not found" },
//         { status: 404 }
//       );
//     }

//     const organization = user.currentOrganization;

//     if (!organization.stripeCustomerId) {
//       return NextResponse.json(
//         { error: "No Stripe customer found" },
//         { status: 400 }
//       );
//     }

//     // 1. Attach new payment method to customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: organization.stripeCustomerId,
//     });

//     // 2. Set as default payment method
//     await stripe.customers.update(organization.stripeCustomerId, {
//       invoice_settings: { default_payment_method: paymentMethodId },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("Error updating card:", error);
//     return NextResponse.json(
//       { error: "Failed to update card", details: error.message },
//       { status: 500 }
//     );
//   }
// }
