import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '@prisma/client'; // Import Product type

export async function POST(request: Request) {
  try {
    // Handle formData with file upload instead of JSON
    const formData = await request.formData();
    
    // Extract product details from form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const shortDescription = formData.get('shortDescription') as string | null;
    const category = formData.get('category') as string;
    const imageFile = formData.get('image') as File;
    const secondaryImageFile = formData.get('secondaryImage') as File;
    let imageUrl: string | null = null;
    let secondaryImageUrl: string | null = null;
    
    if (imageFile && imageFile.name) {
      // Initialize S3 client
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      });

      // Create a unique filename
      const fileExtension = imageFile.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const key = `projects-images/${uniqueFilename}`;
      
      // Convert file to buffer
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: 'uploads',
        Key: key,
        Body: buffer,
        ContentType: imageFile.type,
      });
      
      await s3Client.send(command);
      
      // Generate public URL - Correct format for Supabase Storage
      imageUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/uploads/${key}`;
    }

    if (secondaryImageFile && secondaryImageFile.name) {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      });

      const fileExtension = secondaryImageFile.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}-secondary.${fileExtension}`;
      {/*const key = `projects-images/${uniqueFilename}`;*/}
      const key = uniqueFilename;
      
      const bytes = await secondaryImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const command = new PutObjectCommand({
        Bucket: 'uploads',
        Key: key,
        Body: buffer,
        ContentType: secondaryImageFile.type,
      });
      
      await s3Client.send(command);
      
      secondaryImageUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/uploads/${key}`;
    }
    
    const productData = {
      name,
      description,
      shortDescription,
      category,
      imageUrl: imageUrl || null,
      secondaryImageUrl: secondaryImageUrl || null
    };
    
    // Find the highest existing rang value
    const highestRangProduct = await prisma.product.findFirst({
      orderBy: {
        rang: 'desc'
      }
    });
    
    // Increment the highest rang value by 1 (or start at 0 if no products exist)
    const nextRang = highestRangProduct ? highestRangProduct.rang + 1 : 0;
    
    // إنشاء المنتج with unique rang
    const product = await prisma.product.create({
      data: { ...productData, rang: nextRang },
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const products: Product[] = await prisma.product.findMany({
      orderBy: {
        rang: 'asc'
      }
    });

    // Ensure all image URLs are properly formatted for Supabase
    const formattedProducts = products.map(product => {
      {/*// If we have an image URL that's not a full URL, construct the full public URL
      let finalImageUrl = product.imageUrl;
      
      if (product.imageUrl && !product.imageUrl.startsWith('http')) {
        // If it's just a filename, prepend the full path
        finalImageUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/uploads/${product.imageUrl}`;
      }*/}
      const finalImageUrl = product.imageUrl;
      return {
        ...product,
        imageUrl: finalImageUrl,
        secondaryImageUrl: product.secondaryImageUrl
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products'},
      { status: 500 }
    );
  }
}
