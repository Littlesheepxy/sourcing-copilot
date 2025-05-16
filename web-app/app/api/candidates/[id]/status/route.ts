import { NextResponse } from 'next/server';
import { candidates } from '../../shared-storage';
import { logs } from '../../../logs/shared-storage';

// 更新候选人状态
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // 验证状态参数
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: '缺少状态参数' },
        { status: 400 }
      );
    }
    
    // 验证状态值
    const validStatuses = ['new', 'processing', 'contacted', 'rejected', 'hired'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      );
    }
    
    // 查找候选人
    const candidateIndex = candidates.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
      return NextResponse.json(
        { success: false, error: '找不到候选人' },
        { status: 404 }
      );
    }
    
    // 记录原始状态
    const previousStatus = candidates[candidateIndex].status;
    
    // 更新候选人状态
    candidates[candidateIndex] = {
      ...candidates[candidateIndex],
      status: body.status,
      updatedAt: new Date().toISOString()
    };
    
    // 记录操作日志
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      action: '更新候选人状态',
      details: `候选人 ${candidates[candidateIndex].name} 状态已更新为 ${body.status}`,
      dataType: 'candidate',
      dataId: id,
      metadata: {
        candidateName: candidates[candidateIndex].name,
        previousStatus,
        newStatus: body.status,
        updateTime: new Date().toISOString()
      }
    };
    
    logs.unshift(logEntry);
    
    return NextResponse.json({
      success: true,
      data: candidates[candidateIndex],
      message: '候选人状态更新成功'
    });
  } catch (error) {
    console.error('更新候选人状态失败', error);
    return NextResponse.json(
      { success: false, error: '更新候选人状态失败' },
      { status: 500 }
    );
  }
} 