import { NextRequest, NextResponse } from 'next/server';
import { readContentFile, writeContentFile } from '@/lib/content';
import { validateProjects, validateSettings } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  try {
    if (file) {
      const data = readContentFile(file);
      return NextResponse.json({ success: true, file, data });
    }

    // Return full content map if no file specified
    const projects = readContentFile('projects.json');
    const settings = readContentFile('settings.json');
    const about = readContentFile('about.json');
    const skills = readContentFile('skills.json');
    const experience = readContentFile('experience.json');
    const education = readContentFile('education.json');

    return NextResponse.json({
      success: true,
      data: { projects, settings, about, skills, experience, education },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file, data } = body;

    if (!file || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing "file" or "data" parameter.' },
        { status: 400 }
      );
    }

    // Run schema validations
    if (file === 'projects.json') {
      const validation = validateProjects(data);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validation.errors },
          { status: 422 }
        );
      }
    } else if (file === 'settings.json') {
      const validation = validateSettings(data);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: validation.errors },
          { status: 422 }
        );
      }
    }

    writeContentFile(file, data);

    return NextResponse.json({
      success: true,
      message: `Draft saved successfully for ${file}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
