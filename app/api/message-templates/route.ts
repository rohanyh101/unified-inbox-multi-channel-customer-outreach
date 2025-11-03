import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Extend the Prisma schema to include MessageTemplate model
// You'll need to add this to your schema.prisma:
/*
model MessageTemplate {
  id          String   @id @default(cuid())
  name        String
  content     String
  category    String
  variables   String[] // Array of variable names
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  @@index([authorId])
  @@index([category])
}
*/

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return default templates since we haven't added the model to schema yet
    const defaultTemplates = [
      {
        id: '1',
        name: 'Welcome Message',
        content: 'Hi {{name}}, welcome to our service! We\'re excited to have you on board. If you have any questions, feel free to reach out.',
        category: 'welcome',
        variables: ['name'],
        createdAt: new Date().toISOString(),
        usageCount: 15
      },
      {
        id: '2',
        name: 'Follow-up',
        content: 'Hi {{name}}, just following up on our conversation from {{date}}. Do you have any updates or questions?',
        category: 'follow-up',
        variables: ['name', 'date'],
        createdAt: new Date().toISOString(),
        usageCount: 8
      },
      {
        id: '3',
        name: 'Appointment Reminder',
        content: 'Hi {{name}}, this is a friendly reminder about your appointment on {{date}} at {{time}}. Please let us know if you need to reschedule.',
        category: 'appointment',
        variables: ['name', 'date', 'time'],
        createdAt: new Date().toISOString(),
        usageCount: 25
      },
      {
        id: '4',
        name: 'Thank You',
        content: 'Thank you {{name}} for choosing our service! We appreciate your business and look forward to serving you again.',
        category: 'general',
        variables: ['name'],
        createdAt: new Date().toISOString(),
        usageCount: 12
      },
      {
        id: '5',
        name: 'Order Confirmation',
        content: 'Hi {{name}}, your order #{{orderNumber}} has been confirmed! Your items will be delivered to {{address}} on {{deliveryDate}}.',
        category: 'order',
        variables: ['name', 'orderNumber', 'address', 'deliveryDate'],
        createdAt: new Date().toISOString(),
        usageCount: 30
      },
      {
        id: '6',
        name: 'Payment Reminder',
        content: 'Hi {{name}}, this is a friendly reminder that your payment of {{amount}} is due on {{dueDate}}. Please let us know if you need any assistance.',
        category: 'payment',
        variables: ['name', 'amount', 'dueDate'],
        createdAt: new Date().toISOString(),
        usageCount: 18
      }
    ];

    return NextResponse.json(defaultTemplates);

    // TODO: When MessageTemplate model is added to schema, use this instead:
    /*
    const templates = await prisma.messageTemplate.findMany({
      where: {
        authorId: session.user.id
      },
      orderBy: {
        usageCount: 'desc'
      }
    });

    return NextResponse.json(templates);
    */
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, content, category } = await request.json();

    if (!name || !content || !category) {
      return NextResponse.json(
        { error: 'Name, content, and category are required' },
        { status: 400 }
      );
    }

    // Extract variables from content
    const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
    const variables = variableMatches 
      ? variableMatches.map((match: string) => match.slice(2, -2).trim())
      : [];

    // For now, return a mock response since we haven't added the model to schema yet
    const newTemplate = {
      id: Date.now().toString(),
      name,
      content,
      category,
      variables,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(newTemplate, { status: 201 });

    // TODO: When MessageTemplate model is added to schema, use this instead:
    /*
    const template = await prisma.messageTemplate.create({
      data: {
        name,
        content,
        category,
        variables,
        authorId: session.user.id
      }
    });

    return NextResponse.json(template, { status: 201 });
    */
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, content, category } = await request.json();

    if (!id || !name || !content || !category) {
      return NextResponse.json(
        { error: 'ID, name, content, and category are required' },
        { status: 400 }
      );
    }

    // Extract variables from content
    const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
    const variables = variableMatches 
      ? variableMatches.map((match: string) => match.slice(2, -2).trim())
      : [];

    // For now, return a mock response
    const updatedTemplate = {
      id,
      name,
      content,
      category,
      variables,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedTemplate);

    // TODO: When MessageTemplate model is added to schema, use this instead:
    /*
    const template = await prisma.messageTemplate.update({
      where: {
        id,
        authorId: session.user.id
      },
      data: {
        name,
        content,
        category,
        variables
      }
    });

    return NextResponse.json(template);
    */
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // For now, return success
    return NextResponse.json({ success: true });

    // TODO: When MessageTemplate model is added to schema, use this instead:
    /*
    await prisma.messageTemplate.delete({
      where: {
        id,
        authorId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
    */
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
