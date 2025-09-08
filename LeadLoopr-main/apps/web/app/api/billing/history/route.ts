// app/api/billing/history/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '../../../../../../packages/database/generated/client';
import { stripe } from '../../../../lib/stripe/stripe';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and current organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        currentOrganization: {
          select: {
            id: true,
            stripeCustomerId: true
          }
        }
      }
    });

    if (!user || !user.currentOrganization) {
      return NextResponse.json({ 
        error: 'User or organization not found' 
      }, { status: 404 });
    }

    const { stripeCustomerId } = user.currentOrganization;

    // If no Stripe customer ID, return empty history
    if (!stripeCustomerId) {
      return NextResponse.json({
        invoices: [],
        hasMore: false,
        total: 0
      });
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 20, // Adjust as needed
      expand: ['data.subscription', 'data.payment_intent']
    });

    // Transform invoices for frontend
    const billingHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
      createdAt: new Date(invoice.created * 1000).toISOString(),
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      description: invoice.description || getInvoiceDescription(invoice),
      downloadUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
      subscriptionId: (invoice as any).subscription ? (typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription.id) : null,
      paymentStatus: getPaymentStatus(invoice),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null
    }));

    return NextResponse.json({
      invoices: billingHistory,
      hasMore: invoices.has_more,
      total: billingHistory.length
    });

  } catch (error: any) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}

function getInvoiceDescription(invoice: any): string {
  if (invoice.lines?.data?.length > 0) {
    const firstLine = invoice.lines.data[0];
    return firstLine.description || 'Subscription charge';
  }
  return 'Subscription charge';
}

function getPaymentStatus(invoice: any): string {
  switch (invoice.status) {
    case 'paid':
      return 'Paid';
    case 'open':
      return 'Pending';
    case 'void':
      return 'Canceled';
    case 'uncollectible':
      return 'Failed';
    case 'draft':
      return 'Draft';
    default:
      return 'Unknown';
  }
}