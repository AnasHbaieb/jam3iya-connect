import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const carouselImages = await prisma.carouselImage.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(carouselImages, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ message: 'No image file provided' }, { status: 400 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    const fileExtension = imageFile.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const key = `carousel-images/${uniqueFilename}`;

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new PutObjectCommand({
      Bucket: 'uploads',
      Key: key,
      Body: buffer,
      ContentType: imageFile.type,
    });

    await s3Client.send(command);

    const imageUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/uploads/${key}`;

    const lastImage = await prisma.carouselImage.findFirst({
      orderBy: { order: 'desc' },
    });
    const newOrder = lastImage ? lastImage.order + 1 : 1;

    const newCarouselImage = await prisma.carouselImage.create({
      data: {
        imageUrl,
        order: newOrder,
      },
    });

    return NextResponse.json(newCarouselImage, { status: 201 });
  } catch (error: unknown) {
    console.error('Error uploading carousel image:', error);
    return NextResponse.json({ message: 'Failed to upload image', error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, order: newOrder } = await request.json();

    if (!id || newOrder === undefined) {
      return NextResponse.json({ message: 'معرف الصورة والترتيب مطلوبان' }, { status: 400 });
    }

    const imageToUpdate = await prisma.carouselImage.findUnique({
      where: { id },
    });

    if (!imageToUpdate) {
      return NextResponse.json({ message: 'الصورة غير موجودة' }, { status: 404 });
    }

    const originalOrder = imageToUpdate.order;

    if (originalOrder === newOrder) {
      return NextResponse.json({ message: 'الترتيب هو نفسه بالفعل' }, { status: 200 });
    }

    await prisma.$transaction(async (prisma) => {
      const imageAtNewOrder = await prisma.carouselImage.findFirst({
        where: { order: newOrder },
      });

      if (imageAtNewOrder) {
        // Step 1: Temporarily set the order of imageToUpdate to a non-conflicting value
        await prisma.carouselImage.update({
          where: { id },
          data: { order: 999999999 }, // Use a large, unlikely order value temporarily
        });

        // Step 2: Update the order of the image that was at newOrder to originalOrder
        await prisma.carouselImage.update({
          where: { id: imageAtNewOrder.id },
          data: { order: originalOrder },
        });
      }

      // Step 3: Set the order of imageToUpdate to newOrder
      await prisma.carouselImage.update({
        where: { id },
        data: { order: newOrder },
      });
    });

    return NextResponse.json({ message: 'تم تحديث ترتيب الصورة بنجاح' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating carousel image order:', error);
    return NextResponse.json({ message: 'فشل تحديث ترتيب الصورة', error: (error as Error).message || 'خطأ غير معروف' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Image ID is required' }, { status: 400 });
    }

    const imageToDelete = await prisma.carouselImage.findUnique({
      where: { id },
    });

    if (!imageToDelete) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    // Extract the key from the imageUrl
    const imageUrlParts = imageToDelete.imageUrl.split('/');
    const key = imageUrlParts.slice(imageUrlParts.indexOf('uploads') + 1).join('/');

    const command = new DeleteObjectCommand({
      Bucket: 'uploads',
      Key: key,
    });

    await s3Client.send(command);

    await prisma.carouselImage.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting carousel image:', error);
    return NextResponse.json({ message: 'Failed to delete image', error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}