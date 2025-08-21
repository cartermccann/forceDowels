import { NextRequest, NextResponse } from 'next/server';
import { getDistributionRequestByUniqueId, updateDistributionRequestStatus, createDistributorFromRequest } from '@/lib/distribution';
import { isValidDistributionRequestId } from '@/lib/distribution-utils';
import { sendDistributorAcceptanceNotification } from '@/lib/distributor-email';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate the ID format
    if (!isValidDistributionRequestId(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      );
    }

    // Get the distribution request
    const distributionRequest = await getDistributionRequestByUniqueId(id);

    if (!distributionRequest) {
      return NextResponse.json(
        { error: 'Distribution request not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (distributionRequest.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Request already processed',
          status: distributionRequest.status,
          processedAt: distributionRequest.respondedAt
        },
        { status: 409 }
      );
    }

    // Update status to accepted
    const updatedRequest = await updateDistributionRequestStatus(id, 'accepted');

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      );
    }

    // Create distributor record from the accepted request
    try {
      const distributor = await createDistributorFromRequest(updatedRequest);
      console.log('Distributor created successfully:', distributor.id);
    } catch (distributorError) {
      console.error('Failed to create distributor record:', distributorError);
      // Don't fail the request, but log the error
      // The status is already updated to accepted
    }

    // Send acceptance notification email to applicant
    try {
      await sendDistributorAcceptanceNotification({
        applicantEmail: updatedRequest.emailAddress,
        applicantName: updatedRequest.fullName,
        businessName: updatedRequest.businessName,
        territory: updatedRequest.territory,
      });
      console.log('Acceptance notification email sent to:', updatedRequest.emailAddress);
    } catch (emailError) {
      console.error('Failed to send acceptance notification email:', emailError);
      // Don't fail the request if email fails - the acceptance is still valid
    }

    return NextResponse.json({
      success: true,
      message: 'Distribution request accepted successfully',
      request: {
        id: updatedRequest.id,
        businessName: updatedRequest.businessName,
        contactName: updatedRequest.fullName,
        status: updatedRequest.status,
        acceptedAt: updatedRequest.respondedAt
      }
    });

  } catch (error) {
    console.error('Error accepting distribution request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle POST requests the same way as GET for this endpoint
  return GET(request, { params });
}
