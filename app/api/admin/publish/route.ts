import { NextRequest, NextResponse } from 'next/server';
import { getGitStatus, publishContent } from '@/lib/git';
import { readContentFile } from '@/lib/content';
import { validateAllContent } from '@/lib/validation';

export async function GET() {
  try {
    const status = await getGitStatus();
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message;

    // Validate content before publishing
    const projects = readContentFile('projects.json');
    const settings = readContentFile('settings.json');
    const validation = validateAllContent({ projects, settings });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content validation failed before publishing.',
          details: validation.errors,
        },
        { status: 422 }
      );
    }

    const result = await publishContent(message);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Publishing failed.',
          steps: result.steps,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Published successfully to GitHub & Vercel deployment initiated!',
      steps: result.steps,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
