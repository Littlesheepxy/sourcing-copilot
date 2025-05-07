interface Chrome {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  }
}

interface Window {
  chrome?: Chrome;
}

// 全局chrome变量声明
declare const chrome: Chrome; 