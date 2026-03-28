import { NextResponse} from "next/server";
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
type ContentPost = Awaited<ReturnType<typeof prisma.contentPost.findFirst>>;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);
        const contentPost = await prisma.contentPost.findUnique({
            where: { id },
        });
        
        if (!contentPost) {
            return NextResponse.json(
                { error: 'Content post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...contentPost,
            category: contentPost.category,
            date: contentPost.date ? new Date(contentPost.date).toISOString().split('T')[0] : null,
            videoUrl: contentPost.videoUrl,
        });
    } catch (error) {
        console.error('Error fetching content post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content post' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log('Update request received for content post ID:', (await params).id);
        
        const id = Number((await params).id);
        const formData = await request.formData();

        console.log('Received FormData:', Object.fromEntries(formData.entries()));

        const title = formData.get('title') as string;
        const category = formData.get('category') as string | null;
        const description = formData.get('description') as string | null;
        const date = formData.get('date') as string | null;
        const imageFile = formData.get('image') as File | null;
        const videoFile = formData.get('video') as File | null;

        console.log('Parsed values:', { id, title, description, category, date });

        const existingContentPost: ContentPost | null = await prisma.contentPost.findUnique({
            where: { id },
        });

        if (!existingContentPost) {
            console.error('Content post not found for ID:', id);
            return NextResponse.json(
                { error: 'Content post not found' },
                { status: 404 }
            );
        }
        
        console.log('Existing content post:', existingContentPost);

        let imageUrl = existingContentPost.imageUrl;
        let videoUrl = existingContentPost.videoUrl;

        const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3`,
            credentials: {
              accessKeyId: process.env.ACCESS_KEY_ID!,
              secretAccessKey: process.env.SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
        });

        // Process new image upload if provided
        if (imageFile && imageFile.name) {
            // Delete old image from S3 if it exists
            // For now, we will just overwrite with new upload. Realistically, you'd implement S3 delete.
            
            const fileExtension = imageFile.name.split('.').pop();
            const uniqueFilename = `${uuidv4()}.${fileExtension}`;
            const folder = 'content-posts-images';
            const key = `${folder}/${uniqueFilename}`;
            
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const command = new PutObjectCommand({
                Bucket: 'uploads',
                Key: key,
                Body: buffer,
                ContentType: imageFile.type,
            });
            
            await s3Client.send(command);
            
            imageUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/uploads/${key}`;
        }

        // Process new video upload if provided
        if (videoFile && videoFile.name) {
            // Delete old video from S3 if it exists
            // For now, we will just overwrite with new upload. Realistically, you'd implement S3 delete.

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

        // Update the content post in the database
        const updateData = {
            title: title || existingContentPost.title,
            category: category ?? existingContentPost.category,
            description: description ?? existingContentPost.description,
            date: date ?? existingContentPost.date,
            imageUrl: imageUrl || existingContentPost.imageUrl,
            videoUrl: videoUrl || existingContentPost.videoUrl,
        };

        const updatedContentPost = await prisma.contentPost.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedContentPost);
    } catch (error) {
        console.error('Error updating content post:', error);
        return NextResponse.json(
            { error: 'Failed to update content post' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = parseInt((await params).id);
        const contentPost = await prisma.contentPost.delete({
            where: { id },
        });

        return NextResponse.json(contentPost);
    } catch (error) {
        console.error('Error deleting content post:', error);
        return NextResponse.json(
            { error: 'Failed to delete content post' },
            { status: 500 }
        );
    }
} 