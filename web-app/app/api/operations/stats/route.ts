import { NextResponse } from 'next/server';
import { logs } from '../../logs/shared-storage';
import { candidates } from '../../candidates/shared-storage';

// 获取操作统计
export async function GET() {
  try {
    // 统计最近7天的日志数量
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 日志统计
    const recentLogs = logs.filter(log => new Date(log.timestamp) >= sevenDaysAgo);
    
    // 按操作类型分组统计
    const actionCounts: Record<string, number> = {};
    recentLogs.forEach(log => {
      if (!actionCounts[log.action]) {
        actionCounts[log.action] = 0;
      }
      actionCounts[log.action]++;
    });
    
    // 按日期统计日志
    const dailyCounts: Record<string, number> = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      dailyCounts[dateString] = 0;
    }
    
    recentLogs.forEach(log => {
      const dateString = new Date(log.timestamp).toISOString().split('T')[0];
      if (dailyCounts[dateString] !== undefined) {
        dailyCounts[dateString]++;
      }
    });
    
    // 候选人状态统计
    const statusCounts: Record<string, number> = {
      new: 0,
      processing: 0,
      contacted: 0,
      rejected: 0,
      hired: 0
    };
    
    candidates.forEach(candidate => {
      if (candidate.status && statusCounts[candidate.status] !== undefined) {
        statusCounts[candidate.status]++;
      }
    });
    
    // 返回统计结果
    return NextResponse.json({
      success: true,
      data: {
        totalLogs: logs.length,
        recentLogs: recentLogs.length,
        actionCounts,
        dailyCounts,
        candidateCounts: {
          total: candidates.length,
          byStatus: statusCounts
        }
      }
    });
  } catch (error) {
    console.error('获取操作统计失败', error);
    return NextResponse.json(
      { success: false, error: '获取操作统计失败' },
      { status: 500 }
    );
  }
} 