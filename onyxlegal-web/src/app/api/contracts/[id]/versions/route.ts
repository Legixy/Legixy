/**
 * /src/app/api/contracts/[id]/versions/route.ts
 *
 * GET /api/contracts/:id/versions - list all versions
 * POST /api/contracts/:id/versions - create new version
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;

  try {
    // Mock data - in production: query Prisma
    // const versions = await prisma.contractVersion.findMany({
    //   where: { contractId },
    //   orderBy: { version: 'desc' },
    // });

    const mockVersions = [
      {
        id: 'version-3',
        contractId,
        version: 3,
        content: 'Updated payment clause with MSME compliance...',
        changeNote: 'AI fixed: Payment clause updated to MSME compliance',
        changedBy: 'ai-agent',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: 'version-2',
        contractId,
        version: 2,
        content: 'Original with user edits...',
        changeNote: 'User updated contract terms',
        changedBy: 'user-1',
        createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      },
      {
        id: 'version-1',
        contractId,
        version: 1,
        content: 'Initial contract version...',
        changeNote: 'Contract created',
        changedBy: 'user-1',
        createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      },
    ];

    return NextResponse.json(mockVersions, { status: 200 });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;

  try {
    const { content, changeNote } = await request.json();

    if (!content || !changeNote) {
      return NextResponse.json(
        { error: 'Missing required fields: content, changeNote' },
        { status: 400 }
      );
    }

    // In production:
    // 1. Get latest version number
    // 2. Create new ContractVersion with version + 1
    // 3. Update Contract.content
    // 4. Return new version

    const mockNewVersion = {
      id: 'version-4',
      contractId,
      version: 4,
      content,
      changeNote,
      changedBy: 'user-1',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(mockNewVersion, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
