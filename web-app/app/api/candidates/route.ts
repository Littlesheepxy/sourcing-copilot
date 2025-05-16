import { NextResponse } from 'next/server';
import { candidates } from './shared-storage';

// 获取候选人列表
export async function GET(request: Request) {
  try {
    // 获取URL参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    
    // 过滤并返回分页后的候选人
    let filteredCandidates = [...candidates];
    
    // 按状态过滤
    if (status) {
      filteredCandidates = filteredCandidates.filter(c => c.status === status);
    }
    
    // 分页
    const paginatedCandidates = filteredCandidates.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedCandidates,
      total: filteredCandidates.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取候选人失败', error);
    return NextResponse.json(
      { success: false, error: '获取候选人失败' },
      { status: 500 }
    );
  }
}

// 添加候选人
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    if (!body.name || !body.education || !body.experience) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }
    
    // 创建新候选人
    const newCandidate = {
      id: `c${Date.now()}`,
      name: body.name,
      education: body.education,
      experience: body.experience,
      skills: body.skills || [],
      company: body.company,
      school: body.school,
      position: body.position,
      status: body.status || 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      detail: body.detail
    };
    
    // 添加到存储
    candidates.unshift(newCandidate);
    
    return NextResponse.json({
      success: true,
      data: newCandidate,
      message: '候选人添加成功'
    });
  } catch (error) {
    console.error('添加候选人失败', error);
    return NextResponse.json(
      { success: false, error: '添加候选人失败' },
      { status: 500 }
    );
  }
} 