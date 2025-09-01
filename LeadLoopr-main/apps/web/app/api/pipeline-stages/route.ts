import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and their current organization
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        currentOrganization: {
          include: {
            stages: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!user?.currentOrganization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = user.currentOrganization.id;
    let stages = user.currentOrganization.stages;

    // If no stages exist, create a default "Open" stage
    if (stages.length === 0) {
      const defaultStage = await prisma.pipelineStage.create({
        data: {
          organizationId,
          name: 'Open',
          position: 0,
          color: 'bg-blue-500',
        },
      });

      stages = [defaultStage];
    }

    return NextResponse.json({
      success: true,
      stages,
    });
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline stages' }, { status: 500 });
  }
}


export async function POST(req: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { stages, action, stageId, name } = body

        // Get the user and their current organization
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                currentOrganization: true
            }
        })

        if (!user?.currentOrganization) {
            return NextResponse.json(
                { error: 'No organization found' },
                { status: 404 }
            )
        }

        const organizationId = user.currentOrganization.id

        // Handle different actions
        if (action === 'add') {
            // Add a new stage
            const existingStages = await prisma.pipelineStage.findMany({
                where: { organizationId },
                orderBy: { position: 'asc' }
            })

            const newPosition = existingStages.length

            // Generate a unique name
            let stageName = name || 'New Stage'
            let counter = 1
            let finalName = stageName

            // Check if the name already exists and generate a unique one
            while (existingStages.some(stage => stage.name === finalName)) {
                finalName = `${stageName} ${counter}`
                counter++
            }

            // Generate a color based on position
            const colors = [
                'bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500',
                'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-yellow-500',
                'bg-red-500', 'bg-gray-500', 'bg-emerald-500', 'bg-cyan-500'
            ];
            const stageColor = colors[newPosition % colors.length];

            const newStage = await prisma.pipelineStage.create({
                data: {
                    organizationId,
                    name: finalName,
                    position: newPosition,
                    color: stageColor
                }
            })

            return NextResponse.json({
                success: true,
                stage: newStage
            })
        } else if (action === 'update') {
            // Update an existing stage name
            if (!stageId || !name) {
                return NextResponse.json(
                    { error: 'Stage ID and name are required' },
                    { status: 400 }
                )
            }

            const trimmedName = name.trim()

            // Check if the new name already exists (excluding the current stage)
            const existingStageWithName = await prisma.pipelineStage.findFirst({
                where: {
                    organizationId,
                    name: trimmedName,
                    id: { not: stageId }
                }
            })

            if (existingStageWithName) {
                return NextResponse.json(
                    { error: 'A stage with this name already exists' },
                    { status: 400 }
                )
            }

            const updatedStage = await prisma.pipelineStage.update({
                where: {
                    id: stageId,
                    organizationId
                },
                data: {
                    name: trimmedName
                }
            })

            return NextResponse.json({
                success: true,
                stage: updatedStage
            })
        } else if (action === 'updateColor') {
            // Update an existing stage color
            if (!stageId || !body.color) {
                return NextResponse.json(
                    { error: 'Stage ID and color are required' },
                    { status: 400 }
                )
            }

            const updatedStage = await prisma.pipelineStage.update({
                where: {
                    id: stageId,
                    organizationId
                },
                data: {
                    color: body.color
                }
            })

            return NextResponse.json({
                success: true,
                stage: updatedStage
            })
        } else if (action === 'delete') {
            // Delete an existing stage
            if (!stageId) {
                return NextResponse.json(
                    { error: 'Stage ID is required' },
                    { status: 400 }
                )
            }

            // Check if the stage exists and belongs to the organization
            const existingStage = await prisma.pipelineStage.findFirst({
                where: {
                    id: stageId,
                    organizationId
                }
            })

            if (!existingStage) {
                return NextResponse.json(
                    { error: 'Stage not found' },
                    { status: 404 }
                )
            }

            // Delete the stage
            await prisma.pipelineStage.delete({
                where: {
                    id: stageId
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Stage deleted successfully'
            })
        } else if (stages) {
            // Handle bulk update (existing functionality)
            if (!Array.isArray(stages)) {
                return NextResponse.json(
                    { error: 'Stages must be an array' },
                    { status: 400 }
                )
            }

            // Delete existing stages
            await prisma.pipelineStage.deleteMany({
                where: { organizationId }
            })

            // Define distinct colors for stages
            const colors = [
                'bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500',
                'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-yellow-500',
                'bg-red-500', 'bg-gray-500', 'bg-emerald-500', 'bg-cyan-500'
            ];

            // Create new stages
            const createdStages = await Promise.all(
                stages.map((stage, index) =>
                    prisma.pipelineStage.create({
                        data: {
                            organizationId,
                            name: stage.name,
                            position: index,
                            color: colors[index % colors.length]
                        }
                    })
                )
            )

            return NextResponse.json({
                success: true,
                stages: createdStages
            })
        } else {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error updating pipeline stages:', error)
        return NextResponse.json(
            { error: 'Failed to update pipeline stages' },
            { status: 500 }
        )
    }
} 