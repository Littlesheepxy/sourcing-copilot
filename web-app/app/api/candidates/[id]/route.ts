import { NextResponse } from 'next/server';
import { candidates, Candidate } from '../shared-storage';

// 获取单个候选人
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 查找候选人
    const candidate = candidates.find(c => c.id === id);
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: '找不到候选人' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('获取候选人详情失败', error);
    return NextResponse.json(
      { success: false, error: '获取候选人详情失败' },
      { status: 500 }
    );
  }
}

// 更新候选人
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // 查找候选人
    const candidateIndex = candidates.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
      return NextResponse.json(
        { success: false, error: '找不到候选人' },
        { status: 404 }
      );
    }
    
    // 更新候选人
    const updatedCandidate: Candidate = {
      ...candidates[candidateIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // 保存更新
    candidates[candidateIndex] = updatedCandidate;
    
    return NextResponse.json({
      success: true,
      data: updatedCandidate,
      message: '候选人更新成功'
    });
  } catch (error) {
    console.error('更新候选人失败', error);
    return NextResponse.json(
      { success: false, error: '更新候选人失败' },
      { status: 500 }
    );
  }
}

// 删除候选人
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 查找候选人
    const candidateIndex = candidates.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
      return NextResponse.json(
        { success: false, error: '找不到候选人' },
        { status: 404 }
      );
    }
    
    // 删除候选人
    const deletedCandidate = candidates.splice(candidateIndex, 1)[0];
    
    return NextResponse.json({
      success: true,
      data: deletedCandidate,
      message: '候选人删除成功'
    });
  } catch (error) {
    console.error('删除候选人失败', error);
    return NextResponse.json(
      { success: false, error: '删除候选人失败' },
      { status: 500 }
    );
  }
} 