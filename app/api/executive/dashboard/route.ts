import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

function formatDuration(seconds?: number | null) {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "EXECUTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // allow client to request more leads via ?take=NN (defaults kept low for performance)
    const params = new URL(request.url).searchParams;
    const take = Math.min(500, Math.max(5, Number(params.get("take") || "20")));

    const [
      queue,
      totalQueueCount,
      followUps,
      missed,
      callingDataQueue,
      totalCallingCount,
      autocallerQueue,
      totalAutocallerCount,
      interestedLeads,
      calls,
      todayCalls,
      connectedCalls,
      avgDuration,
      interestedCount,
      bookedCount,
      followUpCount,
      userState,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: {
          assignedToId: user.id,
          status: { in: ["NEW", "CALLED"] },
          source: { notIn: ["Calling data", "Autocaller data"] },
          remark: null,
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take,
      }),
      // total count for today's queue (for pagination)
      prisma.lead.count({
        where: {
          assignedToId: user.id,
          status: { in: ["NEW", "CALLED"] },
          source: { notIn: ["Calling data", "Autocaller data"] },
          remark: null,
        },
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: user.id,
          status: "FOLLOW_UP",
          source: { notIn: ["Calling data", "Autocaller data"] },
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { followUpDate: "asc" },
        take: Math.min(200, Math.max(5, Math.floor(take / 2))),
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: user.id,
          status: "CALLED",
          remark: { in: ["NO_ANSWER", "BUSY", "SWITCH_OFF", "WRONG_NUMBER", "CALLBACK"] },
          source: { notIn: ["Calling data", "Autocaller data"] },
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: Math.min(200, Math.max(5, Math.floor(take / 2))),
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: user.id,
          status: { in: ["NEW", "CALLED"] },
          source: "Calling data",
          remark: null,
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take,
      }),
      // total count for calling data
      prisma.lead.count({
        where: {
          assignedToId: user.id,
          status: { in: ["NEW", "CALLED"] },
          source: "Calling data",
          remark: null,
        },
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: user.id,
          status: { in: ["NEW", "CALLED"] },
          source: "Autocaller data",
          remark: null,
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take,
      }),
      // total count for autocaller data
      prisma.lead.count({
        where: {
          assignedToId: user.id,
          status: { in: ["NEW", "CALLED"] },
          source: "Autocaller data",
          remark: null,
        },
      }),
      prisma.lead.findMany({
        where: {
          assignedToId: user.id,
          status: "INTERESTED",
        },
        include: {
          campaign: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take,
      }),
      prisma.call.findMany({
        where: {
          executiveId: user.id,
          startedAt: { gte: startOfToday },
        },
        include: {
          lead: true,
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
      prisma.call.count({
        where: {
          executiveId: user.id,
          startedAt: { gte: startOfToday },
        },
      }),
      prisma.call.count({
        where: {
          executiveId: user.id,
          startedAt: { gte: startOfToday },
          duration: { gt: 0 },
        },
      }),
      prisma.call.aggregate({
        _avg: {
          duration: true,
        },
        where: {
          executiveId: user.id,
          startedAt: { gte: startOfToday },
          duration: { gt: 0 },
        },
      }),
      prisma.lead.count({
        where: {
          assignedToId: user.id,
          status: "INTERESTED",
        },
      }),
      prisma.lead.count({
        where: {
          assignedToId: user.id,
          status: "BOOKED",
        },
      }),
      prisma.lead.count({
        where: {
          assignedToId: user.id,
          status: "FOLLOW_UP",
          source: { notIn: ["Calling data", "Autocaller data"] },
        },
      }),
      prisma.executiveState.findUnique({
        where: { userId: user.id },
      }),
    ]);

    const totalAssigned = queue.length + followUps.length + missed.length;
    const avgTalkTime = avgDuration._avg.duration ? Math.round(avgDuration._avg.duration / 60) : 0;
    const conversion = totalAssigned > 0 ? Math.round((bookedCount / totalAssigned) * 100) : 0;
    const nextCampaign = (queue[0] && queue[0].campaign && queue[0].campaign.name) || (followUps[0] && followUps[0].campaign && followUps[0].campaign.name) || null;

    const mappedQueue = queue.map((lead) => ({
      id: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      project: lead.project !== undefined ? lead.project : undefined,
      city: lead.city !== undefined ? lead.city : undefined,
      source: lead.source !== undefined ? lead.source : undefined,
      status: lead.status,
      remark: lead.remark !== undefined ? lead.remark : undefined,
      followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : null,
      assignedDate: lead.updatedAt ? lead.updatedAt.toISOString() : lead.createdAt.toISOString(),
      campaign: lead.campaign ? lead.campaign.name : undefined,
    }));

    const mappedFollowUps = followUps.map((lead) => ({
      id: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      project: lead.project !== undefined ? lead.project : undefined,
      city: lead.city !== undefined ? lead.city : undefined,
      source: lead.source !== undefined ? lead.source : undefined,
      status: lead.status,
      remark: lead.remark !== undefined ? lead.remark : undefined,
      followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : null,
      assignedDate: lead.updatedAt ? lead.updatedAt.toISOString() : lead.createdAt.toISOString(),
      campaign: lead.campaign ? lead.campaign.name : undefined,
    }));

    const mappedMissed = missed.map((lead) => ({
      id: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      project: lead.project !== undefined ? lead.project : undefined,
      city: lead.city !== undefined ? lead.city : undefined,
      source: lead.source !== undefined ? lead.source : undefined,
      status: lead.status,
      remark: lead.remark !== undefined ? lead.remark : undefined,
      followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : null,
      assignedDate: lead.updatedAt ? lead.updatedAt.toISOString() : lead.createdAt.toISOString(),
      campaign: lead.campaign ? lead.campaign.name : undefined,
    }));

    const mappedInterested = interestedLeads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      project: lead.project !== undefined ? lead.project : undefined,
      city: lead.city !== undefined ? lead.city : undefined,
      source: lead.source !== undefined ? lead.source : undefined,
      status: lead.status,
      remark: lead.remark !== undefined ? lead.remark : undefined,
      followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : null,
      assignedDate: lead.updatedAt ? lead.updatedAt.toISOString() : lead.createdAt.toISOString(),
      campaign: lead.campaign ? lead.campaign.name : undefined,
    }));

    const mappedCalls = calls.map((call) => {
      const metadata = (call.metadata ?? {}) as Record<string, unknown>;
      return {
        id: call.id,
        leadId: call.lead?.id,
        leadName: call.lead?.name,
        startedAt: call.startedAt ? call.startedAt.toISOString() : null,
        duration: call.duration ?? 0,
        outcome: call.outcome ?? undefined,
        lastAction: typeof metadata.lastAction === "string" ? metadata.lastAction : undefined,
      };
    });

    const executiveStatus = userState && userState.status ? userState.status : "ONLINE";
    const data = {
      executive: {
        name: user.fullName || user.username || "Executive",
        shift: null,
        campaign: nextCampaign,
        status: executiveStatus,
      },
      metrics: {
        todayCalls,
        connectedCalls,
        interested: interestedCount,
        booked: bookedCount,
        followUps: followUpCount,
        averageTalkTime: avgTalkTime,
        conversion,
        queueRemaining: queue.length,
      },
      queue: mappedQueue,
      followUps: mappedFollowUps,
      missed: mappedMissed,
      interestedLeads: mappedInterested,
      callingDataLeads: callingDataQueue.map((lead) => ({
        id: lead.id,
        name: lead.name,
        mobile: lead.mobile,
        project: lead.project !== undefined ? lead.project : undefined,
        city: lead.city !== undefined ? lead.city : undefined,
        source: lead.source !== undefined ? lead.source : undefined,
        status: lead.status,
        remark: lead.remark !== undefined ? lead.remark : undefined,
        followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : null,
        assignedDate: lead.updatedAt ? lead.updatedAt.toISOString() : lead.createdAt.toISOString(),
        campaign: lead.campaign ? lead.campaign.name : undefined,
      })),
      autocallerLeads: autocallerQueue.map((lead) => ({
        id: lead.id,
        name: lead.name,
        mobile: lead.mobile,
        project: lead.project !== undefined ? lead.project : undefined,
        city: lead.city !== undefined ? lead.city : undefined,
        source: lead.source !== undefined ? lead.source : undefined,
        status: lead.status,
        remark: lead.remark !== undefined ? lead.remark : undefined,
        followUpDate: lead.followUpDate ? lead.followUpDate.toISOString() : null,
        assignedDate: lead.updatedAt ? lead.updatedAt.toISOString() : lead.createdAt.toISOString(),
        campaign: lead.campaign ? lead.campaign.name : undefined,
      })),
      recentCalls: mappedCalls,
      totals: {
        queue: totalQueueCount,
        callingData: totalCallingCount,
        autocaller: totalAutocallerCount,
      },
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Executive dashboard failed", error);
    return NextResponse.json({ error: "Unable to load executive dashboard." }, { status: 500 });
  }
}
