import { NextRequest, NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-error';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import {
  createFallbackPortfolioProject,
  listFallbackPortfolioProjects,
} from '@/lib/fallback-portfolio-store';

export async function GET() {
  try {
    const projects = listFallbackPortfolioProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    const { title, description, category, image, year, paints } = await request.json();

    if (!title || !description || !category || !year || !Array.isArray(paints)) {
      throw new ApiError(400, 'Missing required portfolio fields');
    }

    const project = createFallbackPortfolioProject({
      title,
      description,
      category,
      image,
      year,
      paints,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}
