import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ContentPost } from '@prisma/client'; // Import ContentPost type

export async function POST(request: Request) {
  try {
    // Handle formData with file upload instead of JSON
    const formData = await request.formData();
    
    // Extract content post details from form data
    const title = formData.get('title') as string;
    const category = formData.get('category') as string | null;
    const description = formData.get('description') as string | null;
    const date = formData.get('date') as string | null;
    const imageFile = formData.get('image') as File;
    const videoFile = formData.get('video') as File;
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    
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
      const folder = 'content-posts-images';
      const key = `${folder}/${uniqueFilename}`;
      
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

    if (videoFile && videoFile.name) {
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_ID!,
          secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      });

      const fileExtension = videoFile.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const folder = 'content-posts-videos';
      const key = `${folder}/${uniqueFilename}`;
      
      const bytes = await videoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const command = new PutObjectCommand({
        Bucket: 'uploads',
        Key: key,
        Body: buffer,
        ContentType: videoFile.type,
      });
      
      await s3Client.send(command);
      
      videoUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/uploads/${key}`;
    }
    
    const postData = {
      title,
      category,
      description,
      date,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null
    };
    
    // Find the highest existing rang value
    const highestRangPost = await prisma.contentPost.findFirst({
      orderBy: {
        rang: 'desc'
      }
    });
    
    // Increment the highest rang value by 1 (or start at 0 if no content posts exist)
    const nextRang = highestRangPost ? highestRangPost.rang + 1 : 0;
    
    // Create the content post with unique rang
    const contentPost = await prisma.contentPost.create({
      data: { ...postData, rang: nextRang },
    });
    
    return NextResponse.json(contentPost, { status: 201 });
  } catch (error) {
    console.error('Error creating content post:', error);
    return NextResponse.json(
      { error: 'Failed to create content post' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let contentPosts: ContentPost[];

    if (limit) {
      contentPosts = await prisma.contentPost.findMany({
        orderBy: {
          rang: 'desc',
        },
        take: parseInt(limit, 10),
      });
    } else {
      contentPosts = await prisma.contentPost.findMany({
        orderBy: {
          rang: 'desc',
        },
      });
    }

    // Ensure all image URLs are properly formatted for Supabase
    const formattedContentPosts = contentPosts.map(post => {
      const finalImageUrl = post.imageUrl;
      return {
        ...post,
        imageUrl: finalImageUrl,
        videoUrl: post.videoUrl,
        category: post.category,
        date: post.date
      };
    });

    return NextResponse.json(formattedContentPosts);
  } catch (error) {
    console.error('Error fetching content posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content posts'},
      { status: 500 }
    );
  }
} 