import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      if (!file) continue;

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 5MB)` },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'audio/mpeg',
        'audio/wav',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create file record
      const fileRecord = {
        id: uuidv4(),
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/${uniqueFilename}`,
        createdAt: new Date().toISOString()
      };

      uploadedFiles.push(fileRecord);

      // TODO: When MediaAttachment model is added to schema, save to database:
      /*
      await prisma.mediaAttachment.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: `/uploads/${uniqueFilename}`,
          uploadedById: session.user.id
        }
      });
      */
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// Get uploaded files for a user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: When MediaAttachment model is added, fetch from database
    /*
    const files = await prisma.mediaAttachment.findMany({
      where: {
        uploadedById: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to recent 50 files
    });

    return NextResponse.json({ files });
    */

    // For now, return empty array
    return NextResponse.json({ files: [] });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
