import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid image ID' }, { status: 400 });
    }

    await prisma.carouselImage.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error deleting carousel image with ID ${(error as Error).message || 'unknown'}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    const { order } = await request.json();

    if (isNaN(numericId) || typeof order !== 'number') {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Check if the new order already exists
    const existingImageWithOrder = await prisma.carouselImage.findFirst({
      where: { order },
    });

    if (existingImageWithOrder && existingImageWithOrder.id !== numericId) {
      // If an image with the target order exists, swap their orders
      await prisma.$transaction(async (prisma) => {
        // Get the current order of the image being moved
        const currentImage = await prisma.carouselImage.findUnique({ where: { id: numericId } });
        if (!currentImage) {
          throw new Error('Image not found');
        }
        const oldOrder = currentImage.order;

        // Update the existing image to the old order of the current image
        await prisma.carouselImage.update({
          where: { id: existingImageWithOrder.id },
          data: { order: oldOrder },
        });

        // Update the current image to the new order
        await prisma.carouselImage.update({
          where: { id: numericId },
          data: { order: order },
        });
      });

      return NextResponse.json({ message: 'Image order swapped successfully' }, { status: 200 });
    } else {
      // No image at the target order, or it's the same image, just update
      const updatedImage = await prisma.carouselImage.update({
        where: { id: numericId },
        data: { order },
      });
      return NextResponse.json(updatedImage, { status: 200 });
    }

  } catch (error: unknown) {
    console.error('Error updating image order by ID:', error);
    return NextResponse.json({ message: 'Failed to update image order', error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}