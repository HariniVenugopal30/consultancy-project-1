import { NextRequest, NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-error';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import {
  deleteFallbackPortfolioProject,
  updateFallbackPortfolioProject,
} from '@/lib/fallback-portfolio-store';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    const { id } = await context.params;
    const { title, description, category, image, year, paints } = await request.json();

    if (!title || !description || !category || !year || !Array.isArray(paints)) {
      throw new ApiError(400, 'Missing required portfolio fields');
    }

    const project = updateFallbackPortfolioProject(id, {
      title,
      description,
      category,
      image,
      year,
      paints,
    });

    if (!project) {
      throw new ApiError(404, 'Portfolio project not found');
    }

    return NextResponse.json({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    const { id } = await context.params;
    const removed = deleteFallbackPortfolioProject(id);

    if (!removed) {
      throw new ApiError(404, 'Portfolio project not found');
    }

    return NextResponse.json({ message: 'Portfolio project deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
