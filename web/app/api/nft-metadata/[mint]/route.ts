import { NextRequest, NextResponse } from 'next/server';

// NFT Constants
const REGULAR_NFT_SYMBOL = 'LKCB';
const CNFT_SYMBOL = 'cLKCB';
const REGULAR_NFT_IMAGE_PATH = '/LKCB_R_NFT.png';
const CNFT_IMAGE_PATH = '/LKCB_C_NFT.png';

// In-memory store for NFT metadata (demo purposes)
// On restart, fallback metadata is returned - name/symbol are on-chain anyway
const metadataStore = new Map<string, { name: string; description: string; createdAt: number }>();

// Cleanup old entries after 24 hours
const METADATA_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupOldEntries() {
    const now = Date.now();
    for (const [key, value] of metadataStore.entries()) {
        if (now - value.createdAt > METADATA_TTL_MS) {
            metadataStore.delete(key);
        }
    }
}

if (typeof setInterval !== 'undefined') {
    setInterval(cleanupOldEntries, 60 * 60 * 1000);
}

/**
 * GET /api/nft-metadata/[mint]
 * Returns JSON metadata for an NFT
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ mint: string }> }
) {
    const { mint } = await params;

    if (!mint) {
        return NextResponse.json(
            { error: 'Mint address is required' },
            { status: 400 }
        );
    }

    const baseUrl = getBaseUrl(request);
    const stored = metadataStore.get(mint);

    // Determine NFT type based on mint ID prefix
    const isCompressed = mint.startsWith('cnft');
    const imagePath = isCompressed ? CNFT_IMAGE_PATH : REGULAR_NFT_IMAGE_PATH;
    const symbol = isCompressed ? CNFT_SYMBOL : REGULAR_NFT_SYMBOL;
    const imageUrl = `${baseUrl}${imagePath}`;

    // Build metadata - use stored values or fallback
    const metadata = {
        name: stored?.name || 'LazorKit NFT',
        symbol,
        description: stored?.description || 'An NFT minted with LazorKit Cookbook - gasless and seamless!',
        image: imageUrl,
        properties: {
            files: [{ uri: imageUrl, type: 'image/png' }],
            category: 'image',
        },
    };

    return NextResponse.json(metadata, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=31536000',
        },
    });
}

/**
 * POST /api/nft-metadata/[mint]
 * Store metadata for an NFT before minting
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ mint: string }> }
) {
    try {
        const { mint } = await params;

        if (!mint) {
            return NextResponse.json(
                { error: 'Mint address is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        if (!description || typeof description !== 'string' || description.trim() === '') {
            return NextResponse.json(
                { error: 'Description is required' },
                { status: 400 }
            );
        }

        if (name.length > 32) {
            return NextResponse.json(
                { error: 'Name must be 32 characters or less' },
                { status: 400 }
            );
        }

        if (description.length > 200) {
            return NextResponse.json(
                { error: 'Description must be 200 characters or less' },
                { status: 400 }
            );
        }

        // Store the metadata
        metadataStore.set(mint, {
            name: name.trim(),
            description: description.trim(),
            createdAt: Date.now(),
        });

        const baseUrl = getBaseUrl(request);

        return NextResponse.json({
            success: true,
            metadataUri: `${baseUrl}/api/nft-metadata/${mint}`,
        });
    } catch (error) {
        console.error('Error storing NFT metadata:', error);
        return NextResponse.json(
            { error: 'Failed to store metadata' },
            { status: 500 }
        );
    }
}

function getBaseUrl(request: NextRequest): string {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    return `${protocol}://${host}`;
}
