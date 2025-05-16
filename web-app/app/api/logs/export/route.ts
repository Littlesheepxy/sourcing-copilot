import { NextResponse } from 'next/server';

// 获取日志API路由中的模拟存储
// 注意：这种方式只适用于开发环境，实际生产中应使用数据库
import { logs } from '../shared-storage';

// 导出日志
export async function GET() {
  try {
    // 导出为JSON字符串
    const exportData = JSON.stringify(logs, null, 2);
    
    return new NextResponse(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sourcing_logs_${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('导出日志失败', error);
    return NextResponse.json(
      { success: false, error: '导出日志失败' },
      { status: 500 }
    );
  }
} 