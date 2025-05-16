import { NextResponse } from 'next/server';
import { logs, LogRecord } from './shared-storage';

// 获取所有日志
export async function GET(request: Request) {
  try {
    // 获取URL参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 返回分页后的日志
    const paginatedLogs = logs.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      total: logs.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取日志失败', error);
    return NextResponse.json(
      { success: false, error: '获取日志失败' },
      { status: 500 }
    );
  }
}

// 添加日志
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    if (!body.action || !body.details) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      );
    }
    
    // 创建新日志
    const newLog: LogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: body.timestamp || new Date().toISOString(),
      action: body.action,
      details: body.details,
      dataType: body.dataType,
      dataId: body.dataId,
      metadata: body.metadata
    };
    
    // 添加到存储
    logs.unshift(newLog);
    
    // 限制日志数量
    const maxLogs = 1000;
    if (logs.length > maxLogs) {
      logs.splice(maxLogs); // 截断数组
    }
    
    return NextResponse.json({
      success: true,
      data: newLog,
      message: '日志添加成功'
    });
  } catch (error) {
    console.error('添加日志失败', error);
    return NextResponse.json(
      { success: false, error: '添加日志失败' },
      { status: 500 }
    );
  }
}

// 清空日志
export async function DELETE() {
  try {
    logs.length = 0; // 清空数组
    return NextResponse.json({
      success: true,
      message: '日志已清空'
    });
  } catch (error) {
    console.error('清空日志失败', error);
    return NextResponse.json(
      { success: false, error: '清空日志失败' },
      { status: 500 }
    );
  }
} 